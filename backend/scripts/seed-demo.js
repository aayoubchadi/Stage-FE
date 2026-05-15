#!/usr/bin/env node
import { runWithCompanyScope } from '../src/lib/tenantContext.js';
import db from '../src/lib/db.js';

const COMPANY_ID = '0d49a48b-e15b-4b2f-a566-bd95e4cd35cf';

function log(...args) { console.log('[seed]', ...args); }
function warn(...args) { console.warn('[seed]', ...args); }

async function ensure(client, query, params, uniqueField) {
  const res = await client.query(query, params);
  return res.rows[0];
}

async function main() {
  log('Seeding demo data for company', COMPANY_ID);
  await runWithCompanyScope(COMPANY_ID, async (client) => {
    // Suppliers
    const supplierRow = await client.query(
      `SELECT id FROM suppliers WHERE company_id = $1 AND name = $2 LIMIT 1`,
      [COMPANY_ID, 'Tech Solutions Inc']
    );
    let supplierId;
    if (supplierRow.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO suppliers (company_id, name, email, phone, address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
        [COMPANY_ID, 'Tech Solutions Inc', 'sales@techsolutions.com', '555-0101', 'John Smith, Sales']
      );
      supplierId = r.rows[0].id;
      log('Inserted supplier', supplierId);
    } else {
      supplierId = supplierRow.rows[0].id;
      log('Supplier exists', supplierId);
    }

    // Customers
    const customerRow = await client.query(
      `SELECT id FROM customers WHERE company_id = $1 AND name = $2 LIMIT 1`,
      [COMPANY_ID, 'Acme Corp']
    );
    let customerId;
    if (customerRow.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO customers (company_id, name, email, phone, address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW(), NOW()) RETURNING id`,
        [COMPANY_ID, 'Acme Corp', 'procurement@acmecorp.com', '555-0202', 'Alice Johnson, Procurement']
      );
      customerId = r.rows[0].id;
      log('Inserted customer', customerId);
    } else {
      customerId = customerRow.rows[0].id;
      log('Customer exists', customerId);
    }

    // Product
    const productRow = await client.query(
      `SELECT id FROM products WHERE company_id = $1 AND sku = $2 LIMIT 1`,
      [COMPANY_ID, 'SKU-DEMO-01']
    );
    let productId;
    if (productRow.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO products (company_id, sku, name, description, unit_price, quantity_in_stock, low_stock_threshold, created_at, updated_at)
         VALUES ($1, $2, $3, $4, $5, $6, $7, NOW(), NOW()) RETURNING id`,
        [COMPANY_ID, 'SKU-DEMO-01', 'Demo Desk', 'Demo seeded desk product', 95.0, 20, 5]
      );
      productId = r.rows[0].id;
      log('Inserted product', productId);
    } else {
      productId = productRow.rows[0].id;
      log('Product exists', productId);
    }

    // Location
    const locRow = await client.query(
      `SELECT id FROM locations WHERE company_id = $1 AND name = $2 LIMIT 1`,
      [COMPANY_ID, 'Seed Warehouse']
    );
    let locationId;
    if (locRow.rowCount === 0) {
      const r = await client.query(
        `INSERT INTO locations (company_id, name, type, address, created_at, updated_at)
         VALUES ($1, $2, $3, $4, NOW(), NOW()) RETURNING id`,
        [COMPANY_ID, 'Seed Warehouse', 'warehouse', '100 Seed St']
      );
      locationId = r.rows[0].id;
      log('Inserted location', locationId);
    } else {
      locationId = locRow.rows[0].id;
      log('Location exists', locationId);
    }

    // Inventory level
    await client.query(
      `INSERT INTO inventory_levels (company_id, location_id, product_id, quantity, last_counted_at, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW(), NOW())
       ON CONFLICT (location_id, product_id) DO UPDATE SET quantity = EXCLUDED.quantity, last_counted_at = EXCLUDED.last_counted_at, updated_at = NOW()`,
      [COMPANY_ID, locationId, productId, 20]
    );
    log('Inventory level set for product', productId);

    // Stock movements
    const movements = [
      { type: 'in', qty: 15, note: 'Seed inbound' },
      { type: 'out', qty: 4, note: 'Seed sale' },
      { type: 'in', qty: 8, note: 'Seed replenish' },
    ];
    for (const m of movements) {
      await client.query(
        `INSERT INTO stock_movements (company_id, product_id, location_id, movement_type, quantity, note, moved_by, created_at)
         VALUES ($1, $2, $3, $4::stock_movement_type, $5, $6, NULL, NOW())`,
        [COMPANY_ID, productId, locationId, m.type, m.qty, m.note]
      );
    }
    log('Inserted stock movements');

    // Purchase order
    const poRow = await client.query(
      `INSERT INTO purchase_orders (company_id, supplier_id, po_number, status, order_date, expected_delivery_date, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW() + INTERVAL '7 days', $5, NOW(), NOW()) RETURNING id, po_number`,
      [COMPANY_ID, supplierId, `PO-SEED-${Date.now()}`, 'draft', 'Seeded purchase order']
    );
    const poId = poRow.rows[0].id;
    await client.query(
      `INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [poId, productId, 10, 90.0]
    );
    log('Created purchase order', poRow.rows[0].po_number);

    // Sales order
    const soRow = await client.query(
      `INSERT INTO sales_orders (company_id, customer_id, order_number, status, order_date, notes, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), $5, NOW(), NOW()) RETURNING id, order_number`,
      [COMPANY_ID, customerId, `SO-SEED-${Date.now()}`, 'draft', 'Seeded sales order']
    );
    const soId = soRow.rows[0].id;
    await client.query(
      `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price, created_at, updated_at)
       VALUES ($1, $2, $3, $4, NOW(), NOW())`,
      [soId, productId, 3, 120.0]
    );
    log('Created sales order', soRow.rows[0].order_number);

    log('Demo seed completed inside company scope');
  });
}

main().catch((err) => {
  console.error('Seed failed:', err);
  process.exit(1);
});
