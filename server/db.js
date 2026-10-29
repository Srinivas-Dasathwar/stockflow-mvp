import { DatabaseSync } from 'node:sqlite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import crypto from 'node:crypto';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DB_PATH = path.join(__dirname, 'stockflow.db');

export const db = new DatabaseSync(DB_PATH);

export function initDb() {
  db.exec('PRAGMA foreign_keys = ON;');
  db.exec('PRAGMA journal_mode = WAL;');

  // Organizations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS organizations (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      default_low_stock_threshold INTEGER NOT NULL DEFAULT 5,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );
  `);

  // Users table
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at TEXT NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE
    );
  `);

  // Products table
  db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      name TEXT NOT NULL,
      sku TEXT NOT NULL,
      description TEXT,
      quantity_on_hand INTEGER NOT NULL DEFAULT 0,
      cost_price REAL DEFAULT 0.0,
      selling_price REAL DEFAULT 0.0,
      low_stock_threshold INTEGER DEFAULT NULL,
      last_updated_by TEXT,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      UNIQUE(organization_id, sku)
    );
  `);

  // Stock Adjustments audit table
  db.exec(`
    CREATE TABLE IF NOT EXISTS stock_adjustments (
      id TEXT PRIMARY KEY,
      organization_id TEXT NOT NULL,
      product_id TEXT NOT NULL,
      change_amount INTEGER NOT NULL,
      previous_quantity INTEGER NOT NULL,
      new_quantity INTEGER NOT NULL,
      note TEXT,
      user_email TEXT,
      created_at TEXT NOT NULL,
      FOREIGN KEY (organization_id) REFERENCES organizations(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  console.log('StockFlow SQLite Database initialized at:', DB_PATH);
}

// Helper query wrappers
export const dbOps = {
  // Organizations
  createOrg(name, defaultLowStockThreshold = 5) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO organizations (id, name, default_low_stock_threshold, created_at, updated_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, name, defaultLowStockThreshold, now, now);
    return this.getOrgById(id);
  },

  getOrgById(id) {
    const stmt = db.prepare('SELECT * FROM organizations WHERE id = ?');
    return stmt.get(id);
  },

  updateOrg(id, { name, default_low_stock_threshold }) {
    const now = new Date().toISOString();
    const current = this.getOrgById(id);
    if (!current) return null;

    const updatedName = name !== undefined ? name : current.name;
    const updatedThreshold = default_low_stock_threshold !== undefined ? Number(default_low_stock_threshold) : current.default_low_stock_threshold;

    const stmt = db.prepare(`
      UPDATE organizations
      SET name = ?, default_low_stock_threshold = ?, updated_at = ?
      WHERE id = ?
    `);
    stmt.run(updatedName, updatedThreshold, now, id);
    return this.getOrgById(id);
  },

  // Users
  createUser({ organization_id, email, password_hash }) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const stmt = db.prepare(`
      INSERT INTO users (id, organization_id, email, password_hash, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    stmt.run(id, organization_id, email.toLowerCase().trim(), password_hash, now);
    return this.getUserById(id);
  },

  getUserByEmail(email) {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email.toLowerCase().trim());
  },

  getUserById(id) {
    const stmt = db.prepare('SELECT id, organization_id, email, created_at FROM users WHERE id = ?');
    return stmt.get(id);
  },

  // Products
  getProductsByOrg(orgId, { search, lowStockOnly } = {}) {
    const org = this.getOrgById(orgId);
    const defaultThreshold = org?.default_low_stock_threshold ?? 5;

    let sql = `
      SELECT p.*,
             COALESCE(p.low_stock_threshold, ?) AS effective_threshold,
             CASE WHEN p.quantity_on_hand <= COALESCE(p.low_stock_threshold, ?) THEN 1 ELSE 0 END AS is_low_stock
      FROM products p
      WHERE p.organization_id = ?
    `;
    const params = [defaultThreshold, defaultThreshold, orgId];

    if (search && search.trim() !== '') {
      const term = `%${search.trim()}%`;
      sql += ` AND (p.name LIKE ? OR p.sku LIKE ? OR p.description LIKE ?)`;
      params.push(term, term, term);
    }

    if (lowStockOnly) {
      sql += ` AND p.quantity_on_hand <= COALESCE(p.low_stock_threshold, ?)`;
      params.push(defaultThreshold);
    }

    sql += ` ORDER BY p.updated_at DESC`;

    const stmt = db.prepare(sql);
    return stmt.all(...params);
  },

  getProductById(orgId, productId) {
    const org = this.getOrgById(orgId);
    const defaultThreshold = org?.default_low_stock_threshold ?? 5;
    const stmt = db.prepare(`
      SELECT p.*,
             COALESCE(p.low_stock_threshold, ?) AS effective_threshold,
             CASE WHEN p.quantity_on_hand <= COALESCE(p.low_stock_threshold, ?) THEN 1 ELSE 0 END AS is_low_stock
      FROM products p
      WHERE p.organization_id = ? AND p.id = ?
    `);
    return stmt.get(defaultThreshold, defaultThreshold, orgId, productId);
  },

  getProductBySku(orgId, sku) {
    const stmt = db.prepare(`
      SELECT * FROM products WHERE organization_id = ? AND LOWER(sku) = LOWER(?)
    `);
    return stmt.get(orgId, sku.trim());
  },

  createProduct(orgId, productData, userEmail) {
    const id = crypto.randomUUID();
    const now = new Date().toISOString();
    const {
      name,
      sku,
      description = '',
      quantity_on_hand = 0,
      cost_price = 0,
      selling_price = 0,
      low_stock_threshold = null,
    } = productData;

    const thresholdVal = low_stock_threshold === '' || low_stock_threshold === null || low_stock_threshold === undefined 
      ? null 
      : Number(low_stock_threshold);

    const stmt = db.prepare(`
      INSERT INTO products (
        id, organization_id, name, sku, description,
        quantity_on_hand, cost_price, selling_price, low_stock_threshold,
        last_updated_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      id,
      orgId,
      name.trim(),
      sku.trim().toUpperCase(),
      description ? description.trim() : null,
      Number(quantity_on_hand) || 0,
      Number(cost_price) || 0,
      Number(selling_price) || 0,
      thresholdVal,
      userEmail || null,
      now,
      now
    );

    return this.getProductById(orgId, id);
  },

  updateProduct(orgId, productId, productData, userEmail) {
    const current = this.getProductById(orgId, productId);
    if (!current) return null;

    const now = new Date().toISOString();
    const name = productData.name !== undefined ? productData.name.trim() : current.name;
    const sku = productData.sku !== undefined ? productData.sku.trim().toUpperCase() : current.sku;
    const description = productData.description !== undefined ? (productData.description ? productData.description.trim() : null) : current.description;
    const quantity_on_hand = productData.quantity_on_hand !== undefined ? Number(productData.quantity_on_hand) : current.quantity_on_hand;
    const cost_price = productData.cost_price !== undefined ? Number(productData.cost_price) : current.cost_price;
    const selling_price = productData.selling_price !== undefined ? Number(productData.selling_price) : current.selling_price;
    
    let low_stock_threshold = current.low_stock_threshold;
    if (productData.low_stock_threshold !== undefined) {
      low_stock_threshold = productData.low_stock_threshold === '' || productData.low_stock_threshold === null 
        ? null 
        : Number(productData.low_stock_threshold);
    }

    const stmt = db.prepare(`
      UPDATE products
      SET name = ?, sku = ?, description = ?, quantity_on_hand = ?,
          cost_price = ?, selling_price = ?, low_stock_threshold = ?,
          last_updated_by = ?, updated_at = ?
      WHERE organization_id = ? AND id = ?
    `);

    stmt.run(
      name,
      sku,
      description,
      quantity_on_hand,
      cost_price,
      selling_price,
      low_stock_threshold,
      userEmail || current.last_updated_by,
      now,
      orgId,
      productId
    );

    return this.getProductById(orgId, productId);
  },

  deleteProduct(orgId, productId) {
    const current = this.getProductById(orgId, productId);
    if (!current) return false;

    const stmt = db.prepare('DELETE FROM products WHERE organization_id = ? AND id = ?');
    stmt.run(orgId, productId);
    return true;
  },

  adjustStock(orgId, productId, delta, note = '', userEmail = '') {
    const current = this.getProductById(orgId, productId);
    if (!current) return null;

    const change = Number(delta);
    if (isNaN(change)) throw new Error('Invalid stock delta');

    const previous_quantity = current.quantity_on_hand;
    const new_quantity = previous_quantity + change;
    const now = new Date().toISOString();
    const adjId = crypto.randomUUID();

    // Insert adjustment record
    const adjStmt = db.prepare(`
      INSERT INTO stock_adjustments (
        id, organization_id, product_id, change_amount, previous_quantity,
        new_quantity, note, user_email, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    adjStmt.run(adjId, orgId, productId, change, previous_quantity, new_quantity, note || 'Manual adjustment', userEmail, now);

    // Update product quantity
    const prodStmt = db.prepare(`
      UPDATE products
      SET quantity_on_hand = ?, last_updated_by = ?, updated_at = ?
      WHERE organization_id = ? AND id = ?
    `);
    prodStmt.run(new_quantity, userEmail || 'system', now, orgId, productId);

    return {
      product: this.getProductById(orgId, productId),
      adjustment: {
        id: adjId,
        change_amount: change,
        previous_quantity,
        new_quantity,
        note,
        created_at: now
      }
    };
  },

  // Dashboard Summary
  getDashboardSummary(orgId) {
    const org = this.getOrgById(orgId);
    const defaultThreshold = org?.default_low_stock_threshold ?? 5;

    // Total products & total quantity & inventory value
    const totalsStmt = db.prepare(`
      SELECT 
        COUNT(*) AS total_products,
        COALESCE(SUM(quantity_on_hand), 0) AS total_quantity,
        COALESCE(SUM(quantity_on_hand * selling_price), 0) AS total_selling_value,
        COALESCE(SUM(quantity_on_hand * cost_price), 0) AS total_cost_value
      FROM products
      WHERE organization_id = ?
    `);
    const totals = totalsStmt.get(orgId);

    // Low stock items
    const lowStockStmt = db.prepare(`
      SELECT p.*,
             COALESCE(p.low_stock_threshold, ?) AS effective_threshold,
             1 AS is_low_stock
      FROM products p
      WHERE p.organization_id = ?
        AND p.quantity_on_hand <= COALESCE(p.low_stock_threshold, ?)
      ORDER BY p.quantity_on_hand ASC, p.updated_at DESC
    `);
    const lowStockProducts = lowStockStmt.all(defaultThreshold, orgId, defaultThreshold);

    return {
      totalProducts: Number(totals.total_products),
      totalQuantity: Number(totals.total_quantity),
      totalSellingValue: Number(totals.total_selling_value),
      totalCostValue: Number(totals.total_cost_value),
      lowStockCount: lowStockProducts.length,
      defaultThreshold,
      lowStockProducts
    };
  },

  // Seed sample products for easy testing
  seedSampleProducts(orgId, userEmail) {
    const samples = [
      {
        name: 'Logitech MX Master 3S Wireless Mouse',
        sku: 'TECH-MSE-01',
        description: 'Quiet clicks and 8K DPI any-surface tracking ergonomics.',
        quantity_on_hand: 3,
        cost_price: 60.00,
        selling_price: 99.99,
        low_stock_threshold: 5
      },
      {
        name: 'Braided USB-C to USB-C Fast Cable (2m)',
        sku: 'CAB-USBC-02',
        description: '100W PD nylon braided high-speed charging cable.',
        quantity_on_hand: 42,
        cost_price: 3.50,
        selling_price: 14.99,
        low_stock_threshold: 10
      },
      {
        name: 'Ergonomic Mechanical Keyboard (RGB)',
        sku: 'TECH-KBD-03',
        description: 'Hot-swappable tactile switches with wireless Bluetooth 5.1.',
        quantity_on_hand: 2,
        cost_price: 75.00,
        selling_price: 139.99,
        low_stock_threshold: 5
      },
      {
        name: 'Aluminum Laptop Stand (Adjustable)',
        sku: 'ACC-STND-04',
        description: 'Foldable ventilation stand for laptops up to 17 inches.',
        quantity_on_hand: 18,
        cost_price: 18.00,
        selling_price: 39.50,
        low_stock_threshold: 5
      },
      {
        name: 'UltraWide 34-Inch Curved Monitor',
        sku: 'DISP-34C-05',
        description: 'WQHD 144Hz HDR gaming and productivity curved panel.',
        quantity_on_hand: 0,
        cost_price: 320.00,
        selling_price: 549.00,
        low_stock_threshold: 4
      },
      {
        name: 'Noise-Cancelling Studio Headphones',
        sku: 'AUD-NCH-06',
        description: 'Active Noise Cancelling over-ear wireless audio headset.',
        quantity_on_hand: 14,
        cost_price: 110.00,
        selling_price: 199.99,
        low_stock_threshold: 5
      }
    ];

    const results = [];
    for (const item of samples) {
      // Check if SKU exists to avoid duplicate constraint errors
      const existing = this.getProductBySku(orgId, item.sku);
      if (!existing) {
        const prod = this.createProduct(orgId, item, userEmail);
        results.push(prod);
      }
    }
    return results;
  }
};
