import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireTenantAccess } from '../middleware/requireTenantAccess.js';
import db from '../lib/db.js';
import HttpError from '../lib/httpError.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenantAccess);

// GET /api/v1/sales-orders
// List all Sales Orders
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT so.*, c.name as customer_name 
       FROM sales_orders so
       JOIN customers c ON c.id = so.customer_id
       WHERE so.company_id = $1
       ORDER BY so.created_at DESC`,
      [req.tenant.companyId]
    );
    res.json({ salesOrders: rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/sales-orders/:id
// Get a SO and its items
router.get('/:id', async (req, res, next) => {
  try {
    // Get SO
    const soResult = await db.query(
      `SELECT so.*, c.name as customer_name 
       FROM sales_orders so
       JOIN customers c ON c.id = so.customer_id
       WHERE so.id = $1 AND so.company_id = $2`,
      [req.params.id, req.tenant.companyId]
    );

    if (soResult.rows.length === 0) {
      throw new HttpError(404, 'so_not_found', 'Sales order not found.');
    }
    const salesOrder = soResult.rows[0];

    // Get Items
    const itemsResult = await db.query(
      `SELECT soi.*, p.name as product_name, p.sku
       FROM sales_order_items soi
       JOIN products p ON p.id = soi.product_id
       WHERE soi.sales_order_id = $1`,
      [salesOrder.id]
    );
    
    salesOrder.items = itemsResult.rows;

    res.json({ salesOrder });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/sales-orders
// Create a new SO with items (deducts overall stock availability logically)
router.post('/', async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { customer_id, order_number, notes, items } = req.body;
    
    if (!customer_id || !order_number || !items || !items.length) {
      throw new HttpError(400, 'invalid_so', 'Customer, order number, and at least one item are required.');
    }

    await client.query('BEGIN');

    // Create SO
    const soRes = await client.query(
      `INSERT INTO sales_orders (company_id, customer_id, order_number, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.tenant.companyId, customer_id, order_number, notes || null]
    );
    const salesOrder = soRes.rows[0];

    // Create Items and verify stock
    const createdItems = [];
    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        throw new HttpError(400, 'invalid_so_item', 'Product and quantity are required for each item.');
      }
      
      // We don't deduct stock purely yet until shipment, but we make sure the item exists
      const productRes = await client.query(
        `SELECT id, unit_price FROM products WHERE id = $1 AND company_id = $2`,
        [item.product_id, req.tenant.companyId]
      );
      
      if (productRes.rows.length === 0) {
        throw new HttpError(404, 'product_not_found', `Product ${item.product_id} not found.`);
      }
      
      const defaultPrice = productRes.rows[0].unit_price;

      const itemRes = await client.query(
        `INSERT INTO sales_order_items (sales_order_id, product_id, quantity, unit_price)
         VALUES ($1, $2, $3, $4)
         RETURNING *`,
        [salesOrder.id, item.product_id, item.quantity, item.unit_price !== undefined ? item.unit_price : defaultPrice]
      );
      createdItems.push(itemRes.rows[0]);
    }

    await client.query('COMMIT');
    
    salesOrder.items = createdItems;
    res.status(201).json({ salesOrder });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      next(new HttpError(409, 'order_number_exists', 'Sales Order number already exists for this company.'));
    } else {
      next(error);
    }
  } finally {
    client.release();
  }
});

// POST /api/v1/sales-orders/:id/ship
// Mark items as shipped, deduct actual inventory from a location
router.post('/:id/ship', async (req, res, next) => {
  const client = await db.getClient();
  try {
    const soId = req.params.id;
    const { location_id, shipped_items } = req.body; 
    // shipped_items: [{ order_item_id, quantity }]
    
    if (!location_id || !shipped_items || !shipped_items.length) {
      throw new HttpError(400, 'invalid_shipping', 'Location and shipped_items array are required.');
    }

    await client.query('BEGIN');

    // Verify SO belongs to company
    const soRes = await client.query(
      `SELECT status FROM sales_orders WHERE id = $1 AND company_id = $2 FOR UPDATE`,
      [soId, req.tenant.companyId]
    );

    if (soRes.rows.length === 0) {
      throw new HttpError(404, 'so_not_found', 'SO not found.');
    }

    for (const shipInfo of shipped_items) {
      // Find item
      const itemRes = await client.query(
        `SELECT * FROM sales_order_items WHERE id = $1 AND sales_order_id = $2 FOR UPDATE`,
        [shipInfo.order_item_id, soId]
      );

      if (itemRes.rows.length === 0) {
         throw new HttpError(404, 'item_not_found', `SO item ${shipInfo.order_item_id} not found in this SO.`);
      }

      const item = itemRes.rows[0];
      const qtyToShip = shipInfo.quantity;

      if (qtyToShip <= 0) continue;
      
      // Update item shipped quantity
      await client.query(
        `UPDATE sales_order_items SET shipped_quantity = shipped_quantity + $1 WHERE id = $2`,
        [qtyToShip, item.id]
      );

      // Deduct from inventory_levels
      const inventoryRes = await client.query(
        `UPDATE inventory_levels SET quantity = quantity - $1 
         WHERE location_id = $2 AND product_id = $3
         RETURNING quantity`,
        [qtyToShip, location_id, item.product_id]
      );
      
      if (inventoryRes.rows.length === 0) {
         throw new HttpError(400, 'insufficient_stock', `Location does not have this product stocked.`);
      }
      if (inventoryRes.rows[0].quantity < 0) {
         throw new HttpError(400, 'insufficient_stock', `Not enough stock in the specified location.`);
      }

      // Update total products quantity
      await client.query(
        `UPDATE products SET quantity_in_stock = quantity_in_stock - $1 WHERE id = $2`,
        [qtyToShip, item.product_id]
      );

      // Record standard movement
      await client.query(
        `INSERT INTO stock_movements (company_id, product_id, location_id, movement_type, quantity, note, moved_by)
         VALUES ($1, $2, $3, 'out', $4, $5, $6)`,
        [req.tenant.companyId, item.product_id, location_id, qtyToShip, `Shipped for SO #${soId}`, req.user.id]
      );
    }
    
    // Check if SO is completely shipped to auto set status
    const allItems = await client.query(
        `SELECT id, quantity, shipped_quantity FROM sales_order_items WHERE sales_order_id = $1`,
        [soId]
    );
    const fullyShipped = allItems.rows.every(i => i.shipped_quantity >= i.quantity);
    
    await client.query(
        `UPDATE sales_orders SET status = $1 WHERE id = $2`,
        [fullyShipped ? 'shipped' : 'processing', soId]
    );

    await client.query('COMMIT');
    res.json({ success: true, fullyShipped });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

export default router;
