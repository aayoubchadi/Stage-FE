import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireTenantAccess } from '../middleware/requireTenantAccess.js';
import db from '../lib/db.js';
import HttpError from '../lib/httpError.js';
import { runWithCompanyScope } from '../lib/tenantContext.js';

const router = Router();

// Require authentication and valid tenant configuration for all routes.
router.use(requireAuth);
router.use(requireTenantAccess);

/**
 * =======================
 * LOCATIONS / WAREHOUSES
 * =======================
 */

// GET /api/v1/inventory/locations
router.get('/locations', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM locations WHERE company_id = $1 ORDER BY name ASC`,
      [req.tenant.companyId]
    );
    res.json({ locations: rows });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/inventory/locations
router.post('/locations', async (req, res, next) => {
  try {
    const { name, type, address } = req.body;
    if (!name) {
      throw new HttpError(400, 'location_name_required', 'Location name is required.');
    }

    const { rows } = await db.query(
      `INSERT INTO locations (company_id, name, type, address)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [req.tenant.companyId, name, type || 'warehouse', address || null]
    );

    res.status(201).json({ location: rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      next(new HttpError(409, 'location_exists', 'A location with this name already exists.'));
    } else {
      next(error);
    }
  }
});

/**
 * =======================
 * INVENTORY LEVELS & MOVEMENTS
 * =======================
 */

// POST /api/v1/inventory/move
// Add/remove/adjust stock for a specific product at a specific location
router.post('/move', async (req, res, next) => {
  try {
    const { product_id, location_id, movement_type, quantity, note } = req.body;
    const userId = req.user.id;
    const companyId = req.tenant.companyId;

    if (!product_id || !location_id || !movement_type || !quantity || quantity <= 0) {
      throw new HttpError(400, 'invalid_movement', 'Product, location, valid movement_type, and positive quantity required.');
    }

    if (!['in', 'out', 'adjustment'].includes(movement_type)) {
      throw new HttpError(400, 'invalid_movement_type', 'Type must be in, out, or adjustment.');
    }

    const movement = await runWithCompanyScope(companyId, async (client) => {
      // Lock product for update
      const productRes = await client.query(
        `SELECT quantity_in_stock FROM products WHERE id = $1 AND company_id = $2 FOR UPDATE`,
        [product_id, companyId]
      );
      if (productRes.rowCount === 0) {
        throw new HttpError(404, 'product_not_found', 'Product not found.');
      }
      
      // Upsert inventory level for the location
      const invRes = await client.query(
        `INSERT INTO inventory_levels (company_id, location_id, product_id, quantity)
         VALUES ($1, $2, $3, 0)
         ON CONFLICT (location_id, product_id) DO UPDATE SET quantity = inventory_levels.quantity
         RETURNING quantity`,
        [companyId, location_id, product_id]
      );
      let currentLocationQuantity = invRes.rows[0].quantity;
      
      // Calculate changes
      let qtyDelta = 0;
      if (movement_type === 'in') {
        qtyDelta = quantity;
      } else if (movement_type === 'out') {
        qtyDelta = -quantity;
      } else if (movement_type === 'adjustment') {
        qtyDelta = quantity - currentLocationQuantity; // adjustment payload quantity is the "new exact quantity"
      }

      if (currentLocationQuantity + qtyDelta < 0) {
        throw new HttpError(400, 'insufficient_stock', 'Not enough stock at this location for this movement.');
      }

      // Update location level
      await client.query(
        `UPDATE inventory_levels SET quantity = quantity + $1, last_counted_at = NOW()
         WHERE location_id = $2 AND product_id = $3`,
        [qtyDelta, location_id, product_id]
      );

      // Update total product level
      await client.query(
        `UPDATE products SET quantity_in_stock = quantity_in_stock + $1 WHERE id = $2`,
        [qtyDelta, product_id]
      );

      // Record movement
      const movementRes = await client.query(
        `INSERT INTO stock_movements (company_id, product_id, location_id, movement_type, quantity, note, moved_by)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [companyId, product_id, location_id, movement_type, movement_type === 'adjustment' ? Math.abs(qtyDelta) : quantity, note, userId]
      );

      return movementRes.rows[0];
    });

    res.status(201).json({ movement });
  } catch (error) {
    next(error);
  }
});

export default router;