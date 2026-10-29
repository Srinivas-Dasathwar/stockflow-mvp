import express from 'express';
import { dbOps } from '../db.js';
import { requireAuth } from '../auth.js';

const router = express.Router();
router.use(requireAuth);

// GET /api/products
router.get('/', (req, res) => {
  try {
    const { search, lowStockOnly } = req.query;
    const isLowStock = lowStockOnly === 'true' || lowStockOnly === '1';
    const products = dbOps.getProductsByOrg(req.user.organizationId, {
      search,
      lowStockOnly: isLowStock,
    });
    return res.json({ products });
  } catch (err) {
    console.error('Error fetching products:', err);
    return res.status(500).json({ error: 'Failed to retrieve products' });
  }
});

// POST /api/products/seed (Demo data generator)
router.post('/seed', (req, res) => {
  try {
    const seeded = dbOps.seedSampleProducts(req.user.organizationId, req.user.email);
    return res.json({
      message: `Successfully loaded ${seeded.length} demo product(s)`,
      products: seeded,
    });
  } catch (err) {
    console.error('Seed error:', err);
    return res.status(500).json({ error: 'Failed to seed sample products' });
  }
});

// GET /api/products/:id
router.get('/:id', (req, res) => {
  try {
    const product = dbOps.getProductById(req.user.organizationId, req.params.id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ product });
  } catch (err) {
    console.error('Error fetching product:', err);
    return res.status(500).json({ error: 'Failed to retrieve product' });
  }
});

// POST /api/products
router.post('/', (req, res) => {
  try {
    const { name, sku, description, quantity_on_hand, cost_price, selling_price, low_stock_threshold } = req.body;

    if (!name || name.trim().length === 0) {
      return res.status(400).json({ error: 'Product name is required.' });
    }
    if (!sku || sku.trim().length === 0) {
      return res.status(400).json({ error: 'SKU is required.' });
    }

    const cleanSku = sku.trim().toUpperCase();
    const existingSku = dbOps.getProductBySku(req.user.organizationId, cleanSku);
    if (existingSku) {
      return res.status(409).json({ error: `A product with SKU "${cleanSku}" already exists in your organization.` });
    }

    const parsedQty = quantity_on_hand !== undefined && quantity_on_hand !== '' ? parseInt(quantity_on_hand, 10) : 0;
    if (isNaN(parsedQty) || parsedQty < 0) {
      return res.status(400).json({ error: 'Quantity on hand must be a non-negative integer.' });
    }

    const newProduct = dbOps.createProduct(req.user.organizationId, {
      name,
      sku: cleanSku,
      description,
      quantity_on_hand: parsedQty,
      cost_price: cost_price ? parseFloat(cost_price) : 0,
      selling_price: selling_price ? parseFloat(selling_price) : 0,
      low_stock_threshold: low_stock_threshold !== undefined && low_stock_threshold !== '' ? parseInt(low_stock_threshold, 10) : null,
    }, req.user.email);

    return res.status(201).json({
      message: 'Product created successfully',
      product: newProduct,
    });
  } catch (err) {
    console.error('Create product error:', err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
});

// PUT /api/products/:id
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const existing = dbOps.getProductById(req.user.organizationId, id);
    if (!existing) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const { name, sku, description, quantity_on_hand, cost_price, selling_price, low_stock_threshold } = req.body;

    if (name !== undefined && name.trim().length === 0) {
      return res.status(400).json({ error: 'Product name cannot be empty.' });
    }

    let cleanSku = existing.sku;
    if (sku !== undefined && sku.trim().length > 0) {
      cleanSku = sku.trim().toUpperCase();
      if (cleanSku !== existing.sku) {
        const skuCheck = dbOps.getProductBySku(req.user.organizationId, cleanSku);
        if (skuCheck && skuCheck.id !== id) {
          return res.status(409).json({ error: `A product with SKU "${cleanSku}" already exists.` });
        }
      }
    }

    let parsedQty = existing.quantity_on_hand;
    if (quantity_on_hand !== undefined && quantity_on_hand !== '') {
      parsedQty = parseInt(quantity_on_hand, 10);
      if (isNaN(parsedQty) || parsedQty < 0) {
        return res.status(400).json({ error: 'Quantity on hand must be a non-negative integer.' });
      }
    }

    const updated = dbOps.updateProduct(req.user.organizationId, id, {
      name,
      sku: cleanSku,
      description,
      quantity_on_hand: parsedQty,
      cost_price: cost_price !== undefined ? parseFloat(cost_price) : undefined,
      selling_price: selling_price !== undefined ? parseFloat(selling_price) : undefined,
      low_stock_threshold: low_stock_threshold !== undefined ? low_stock_threshold : undefined,
    }, req.user.email);

    return res.json({
      message: 'Product updated successfully',
      product: updated,
    });
  } catch (err) {
    console.error('Update product error:', err);
    return res.status(500).json({ error: 'Failed to update product' });
  }
});

// DELETE /api/products/:id
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const deleted = dbOps.deleteProduct(req.user.organizationId, id);
    if (!deleted) {
      return res.status(404).json({ error: 'Product not found' });
    }
    return res.json({ message: 'Product deleted successfully', id });
  } catch (err) {
    console.error('Delete product error:', err);
    return res.status(500).json({ error: 'Failed to delete product' });
  }
});

// POST /api/products/:id/adjust (Stock +/- adjustments)
router.post('/:id/adjust', (req, res) => {
  try {
    const { id } = req.params;
    const { delta, note } = req.body;

    const change = parseInt(delta, 10);
    if (isNaN(change) || change === 0) {
      return res.status(400).json({ error: 'Please enter a non-zero adjustment amount (e.g. +5 or -3).' });
    }

    const product = dbOps.getProductById(req.user.organizationId, id);
    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    if (product.quantity_on_hand + change < 0) {
      return res.status(400).json({
        error: `Cannot reduce stock by ${Math.abs(change)}. Current stock is ${product.quantity_on_hand}.`,
      });
    }

    const result = dbOps.adjustStock(
      req.user.organizationId,
      id,
      change,
      note || `Stock adjusted by ${change > 0 ? `+${change}` : change} units`,
      req.user.email
    );

    return res.json({
      message: `Stock successfully updated by ${change > 0 ? `+${change}` : change} units`,
      product: result.product,
      adjustment: result.adjustment,
    });
  } catch (err) {
    console.error('Adjust stock error:', err);
    return res.status(500).json({ error: 'Failed to adjust stock' });
  }
});

export default router;
