import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireTenantAccess } from '../middleware/requireTenantAccess.js';
import db from '../lib/db.js';
import HttpError from '../lib/httpError.js';

const router = Router();

router.use(requireAuth);
router.use(requireTenantAccess);

// GET /api/v1/purchase-orders
// List all POs
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      \`SELECT po.*, s.name as supplier_name 
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       WHERE po.company_id = $1
       ORDER BY po.created_at DESC\`,
      [req.tenant.companyId]
    );
    res.json({ purchaseOrders: rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/purchase-orders/:id
// Get a PO and its items
router.get('/:id', async (req, res, next) => {
  try {
    // Get PO
    const poResult = await db.query(
      \`SELECT po.*, s.name as supplier_name 
       FROM purchase_orders po
       JOIN suppliers s ON s.id = po.supplier_id
       WHERE po.id = $1 AND po.company_id = $2\`,
      [req.params.id, req.tenant.companyId]
    );

    if (poResult.rows.length === 0) {
      throw new HttpError(404, 'po_not_found', 'Purchase order not found.');
    }
    const purchaseOrder = poResult.rows[0];

    // Get Items
    const itemsResult = await db.query(
      \`SELECT poi.*, p.name as product_name, p.sku
       FROM purchase_order_items poi
       JOIN products p ON p.id = poi.product_id
       WHERE poi.purchase_order_id = $1\`,
      [purchaseOrder.id]
    );
    
    purchaseOrder.items = itemsResult.rows;

    res.json({ purchaseOrder });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/purchase-orders
// Create a new PO with items
router.post('/', async (req, res, next) => {
  const client = await db.getClient();
  try {
    const { supplier_id, po_number, expected_delivery_date, notes, items } = req.body;
    
    if (!supplier_id || !po_number || !items || !items.length) {
      throw new HttpError(400, 'invalid_po', 'Supplier, PO number, and at least one item are required.');
    }

    await client.query('BEGIN');

    // Create PO
    const poRes = await client.query(
      \`INSERT INTO purchase_orders (company_id, supplier_id, po_number, expected_delivery_date, notes)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *\`,
      [req.tenant.companyId, supplier_id, po_number, expected_delivery_date || null, notes || null]
    );
    const purchaseOrder = poRes.rows[0];

    // Create Items
    const createdItems = [];
    for (const item of items) {
      if (!item.product_id || !item.quantity) {
        throw new HttpError(400, 'invalid_po_item', 'Product and quantity are required for each item.');
      }
      const itemRes = await client.query(
        \`INSERT INTO purchase_order_items (purchase_order_id, product_id, quantity, unit_cost)
         VALUES ($1, $2, $3, $4)
         RETURNING *\`,
        [purchaseOrder.id, item.product_id, item.quantity, item.unit_cost || 0]
      );
      createdItems.push(itemRes.rows[0]);
    }

    await client.query('COMMIT');
    
    purchaseOrder.items = createdItems;
    res.status(201).json({ purchaseOrder });
  } catch (error) {
    await client.query('ROLLBACK');
    if (error.code === '23505') {
      next(new HttpError(409, 'po_number_exists', 'PO number already exists for this company.'));
    } else {
      next(error);
    }
  } finally {
    client.release();
  }
});

// POST /api/v1/purchase-orders/:id/receive
// Mark items as received and increment inventory in a specific location
router.post('/:id/receive', async (req, res, next) => {
  const client = await db.getClient();
  try {
    const poId = req.params.id;
    const { location_id, received_items } = req.body; 
    // received_items: [{ order_item_id, quantity }]
    
    if (!location_id || !received_items || !received_items.length) {
      throw new HttpError(400, 'invalid_receiving', 'Location and received_items array are required.');
    }

    await client.query('BEGIN');

    // Verify PO belongs to company
    const poRes = await client.query(
      \`SELECT status FROM purchase_orders WHERE id = $1 AND company_id = $2 FOR UPDATE\`,
      [poId, req.tenant.companyId]
    );

    if (poRes.rows.length === 0) {
      throw new HttpError(404, 'po_not_found', 'PO not found.');
    }

    for (const recInfo of received_items) {
      // Find item
      const itemRes = await client.query(
        \`SELECT * FROM purchase_order_items WHERE id = $1 AND purchase_order_id = $2 FOR UPDATE\`,
        [recInfo.order_item_id, poId]
      );

      if (itemRes.rows.length === 0) {
         throw new HttpError(404, 'item_not_found', \`PO item \${recInfo.order_item_id} not found in this PO.\`);
      }

      const item = itemRes.rows[0];
      const qtyToReceive = recInfo.quantity;

      if (qtyToReceive <= 0) continue;

      // Update item received quantity
      await client.query(
        \`UPDATE purchase_order_items SET received_quantity = received_quantity + $1 WHERE id = $2\`,
        [qtyToReceive, item.id]
      );

      // Add to inventory_levels
      await client.query(
        \`INSERT INTO inventory_levels (company_id, location_id, product_id, quantity)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (location_id, product_id) DO UPDATE SET quantity = inventory_levels.quantity + $4\`,
        [req.tenant.companyId, location_id, item.product_id, qtyToReceive]
      );

      // Update total products quantity
      await client.query(
        \`UPDATE products SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2\`,
        [qtyToReceive, item.product_id]
      );

      // Record standard movement
      await client.query(
        \`INSERT INTO stock_movements (company_id, product_id, location_id, movement_type, quantity, note, moved_by)
         VALUES ($1, $2, $3, 'in', $4, $5, $6)\`,
        [req.tenant.companyId, item.product_id, location_id, qtyToReceive, \`Received from PO #\${poId}\`, req.user.id]
      );
    }
    
    // Check if PO is completely received to auto set status
    const allItems = await client.query(
        \`SELECT id, quantity, received_quantity FROM purchase_order_items WHERE purchase_order_id = $1\`,
        [poId]
    );
    const fullyReceived = allItems.rows.every(i => i.received_quantity >= i.quantity);
    
    await client.query(
        \`UPDATE purchase_orders SET status = $1 WHERE id = $2\`,
        [fullyReceived ? 'received' : 'pending', poId]
    );

    await client.query('COMMIT');
    res.json({ success: true, fullyReceived });
  } catch (error) {
    await client.query('ROLLBACK');
    next(error);
  } finally {
    client.release();
  }
});

export default router;