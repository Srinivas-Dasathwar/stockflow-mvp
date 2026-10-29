# StockFlow MVP (v0.1)

A clean, multi-tenant SaaS Inventory Management MVP built strictly according to the **Phase 1 – 6-Hour MVP PRD**.

---

## 🎯 PRD Feature Mapping

| PRD Section | Feature | Implementation Details |
|---|---|---|
| **FR-1** | Signup & Login | Secure email & password auth with bcrypt hashing and JWT tokens. Pre-fill demo button included. |
| **FR-2** | Organization Context | Tenant organization created on signup. Strict multi-tenant query scoping; zero data leaks. |
| **FR-3** | Product Model | Supports `id`, `name`, unique `sku` per org, `description`, `quantity_on_hand`, `cost_price`, `selling_price`, `low_stock_threshold`. |
| **FR-4** | Product CRUD | Full Create, Read (search + filter), Update (edit modal), and Delete (with confirmation dialog). |
| **FR-5** | Simple Stock Updates | Direct quantity editing + quick **"Adjust Stock"** modal (`+/- N units` with reason/notes and audit logging). |
| **FR-6** | Dashboard Overview | Total products, total units on hand, inventory valuation, and dedicated **Low Stock Items** card/table. |
| **FR-7** | Global Settings | Configurable organization name and `default_low_stock_threshold` (e.g., 5 units) with automatic inheritance fallback. |

---

## 🚀 Quick Start

### 1. Requirements
- Node.js (v18+)

### 2. Running the Application
The application is pre-built and runs in standalone mode serving both the API and the React frontend on **port 5000**:

```bash
npm start
```

Open your browser to:
👉 **[http://localhost:5000](http://localhost:5000)**

### 3. Development Mode
To run Vite with hot-module reloading proxying to Express:

```bash
# Terminal 1: Backend server
npm run server

# Terminal 2: Frontend dev server
npm run dev
```

### 4. Running the Automated Test Suite
To execute the comprehensive end-to-end integration and multi-tenant test suite:

```bash
node test-e2e.js
```

---

## 🧪 Demo Data & Instant Review
When logged into any organization, click **"Load Sample Data"** in the sidebar or empty catalog screen to instantly seed realistic inventory items with healthy, low-stock, and out-of-stock variations.
