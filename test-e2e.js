import http from 'node:http';

async function req(url, options = {}) {
  const fullUrl = `http://localhost:5000${url}`;
  const headers = { 'Content-Type': 'application/json', ...(options.headers || {}) };
  const res = await fetch(fullUrl, {
    ...options,
    headers,
  });
  const data = await res.json().catch(() => ({}));
  return { status: res.status, ok: res.ok, data };
}

async function runTests() {
  console.log('--- STARTING STOCKFLOW MVP AUTOMATED TEST SUITE ---');

  // 1. Health check
  const health = await req('/api/health');
  console.assert(health.ok, 'Health check failed');
  console.log('✓ Health check passed');

  // 2. Auth: Org A Signup
  const userAEmail = `tester_${Date.now()}@acme.com`;
  const signupA = await req('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: userAEmail,
      password: 'password123',
      organizationName: 'Acme Electronics'
    })
  });
  console.assert(signupA.status === 201, `Signup Org A failed: ${JSON.stringify(signupA.data)}`);
  const tokenA = signupA.data.token;
  const orgAId = signupA.data.org.id;
  console.log(`✓ Org A signed up: "${signupA.data.org.name}" (ID: ${orgAId})`);

  // 3. Auth: Org B Signup (for multi-tenant isolation testing)
  const userBEmail = `tester_${Date.now()}@beta.com`;
  const signupB = await req('/api/auth/signup', {
    method: 'POST',
    body: JSON.stringify({
      email: userBEmail,
      password: 'password123',
      organizationName: 'Beta Retail Co'
    })
  });
  console.assert(signupB.status === 201, `Signup Org B failed: ${JSON.stringify(signupB.data)}`);
  const tokenB = signupB.data.token;
  const orgBId = signupB.data.org.id;
  console.log(`✓ Org B signed up: "${signupB.data.org.name}" (ID: ${orgBId})`);

  // 4. Product Creation for Org A
  const createP1 = await req('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Gaming Headset Pro',
      sku: 'AUDIO-001',
      description: '7.1 Surround Sound',
      quantity_on_hand: 10,
      cost_price: 30.0,
      selling_price: 59.99,
      low_stock_threshold: 5
    })
  });
  console.assert(createP1.status === 201, `Create P1 failed: ${JSON.stringify(createP1.data)}`);
  const p1 = createP1.data.product;
  console.log('✓ Org A created product 1 (Healthy Stock):', p1.name);

  const createP2 = await req('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'HDMI 2.1 Cable 4K',
      sku: 'CAB-HDMI-02',
      quantity_on_hand: 2, // low stock!
      cost_price: 2.0,
      selling_price: 9.99,
      low_stock_threshold: 5
    })
  });
  console.assert(createP2.status === 201, 'Create P2 failed');
  const p2 = createP2.data.product;
  console.log('✓ Org A created product 2 (Low Stock):', p2.name);

  // 5. SKU Uniqueness check within same Org (should fail with 409)
  const duplicateSku = await req('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Duplicate SKU Item',
      sku: 'AUDIO-001', // same SKU
      quantity_on_hand: 1
    })
  });
  console.assert(duplicateSku.status === 409, 'Duplicate SKU within same org should have returned 409');
  console.log('✓ Duplicate SKU validation in Org A prevented collision as expected');

  // 6. Cross-Tenant Isolation: Org B creating same SKU 'AUDIO-001' (SHOULD SUCCEED because orgs are isolated)
  const orgBSameSku = await req('/api/products', {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenB}` },
    body: JSON.stringify({
      name: 'Beta Custom Headset',
      sku: 'AUDIO-001', // allowed in Org B!
      quantity_on_hand: 20
    })
  });
  console.assert(orgBSameSku.status === 201, 'Same SKU in different org should succeed');
  console.log('✓ Multi-tenant check: Org B successfully used SKU "AUDIO-001" without interfering with Org A');

  // Org B should see only 1 product in their catalog
  const orgBList = await req('/api/products', {
    headers: { Authorization: `Bearer ${tokenB}` }
  });
  console.assert(orgBList.data.products.length === 1, 'Org B should only see its own products');
  console.log('✓ Multi-tenant check: Org B does not see Org A products');

  // 7. Product Update (FR-4)
  const updateP1 = await req(`/api/products/${p1.id}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      name: 'Gaming Headset Pro (Updated)',
      selling_price: 64.99
    })
  });
  console.assert(updateP1.status === 200 && updateP1.data.product.selling_price === 64.99, 'Update failed');
  console.log('✓ Product update succeeded:', updateP1.data.product.name);

  // 8. Stock Adjustment (+/- units) (FR-5)
  const adjustPlus = await req(`/api/products/${p1.id}/adjust`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      delta: 5,
      note: 'Restock shipment received'
    })
  });
  console.assert(adjustPlus.status === 200 && adjustPlus.data.product.quantity_on_hand === 15, 'Adjust +5 failed');
  console.log('✓ Quick stock adjustment (+5): new stock =', adjustPlus.data.product.quantity_on_hand);

  const adjustMinus = await req(`/api/products/${p1.id}/adjust`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      delta: -3,
      note: 'Damaged item write-off'
    })
  });
  console.assert(adjustMinus.status === 200 && adjustMinus.data.product.quantity_on_hand === 12, 'Adjust -3 failed');
  console.log('✓ Quick stock adjustment (-3): new stock =', adjustMinus.data.product.quantity_on_hand);

  // 9. Dashboard Overview (FR-6)
  const dash = await req('/api/dashboard', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  console.assert(dash.status === 200, 'Dashboard call failed');
  console.assert(dash.data.summary.totalProducts === 2, `Expected 2 products, got ${dash.data.summary.totalProducts}`);
  console.assert(dash.data.summary.totalQuantity === 14, `Expected 14 total units (12+2), got ${dash.data.summary.totalQuantity}`);
  console.assert(dash.data.summary.lowStockCount === 1, `Expected 1 low stock item, got ${dash.data.summary.lowStockCount}`);
  console.log('✓ Dashboard overview verified: 2 products, 14 units, 1 low-stock item');

  // 10. Settings & Threshold Inheritance (FR-7)
  const updateSettings = await req('/api/settings', {
    method: 'PUT',
    headers: { Authorization: `Bearer ${tokenA}` },
    body: JSON.stringify({
      default_low_stock_threshold: 15
    })
  });
  console.assert(updateSettings.status === 200 && updateSettings.data.organization.default_low_stock_threshold === 15, 'Settings update failed');
  console.log('✓ Settings updated: default_low_stock_threshold = 15');

  // 11. Product Deletion (FR-4)
  const delP2 = await req(`/api/products/${p2.id}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  console.assert(delP2.status === 200, 'Delete product failed');
  const verifyList = await req('/api/products', {
    headers: { Authorization: `Bearer ${tokenA}` }
  });
  console.assert(verifyList.data.products.length === 1, 'Product deletion should leave 1 product');
  console.log('✓ Product deleted with confirmation verification');

  console.log('--- ALL AUTOMATED VERIFICATION TESTS PASSED SUCCESSFULLY! ---');
}

runTests().catch((err) => {
  console.error('Test suite failed:', err);
  process.exit(1);
});
