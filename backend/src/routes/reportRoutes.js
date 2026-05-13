import express from 'express';
import { db } from '../lib/db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireTenantAccess } from '../middleware/requireTenantAccess.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireTenantAccess);

// Get dashboard summary (low stock, total value, active orders)
router.get('/summary', async (req, res, next) => {
  try {
    const { companyId } = req.tenant;

    const lowStockResult = await db.query(
      \`SELECT count(*) as low_stock_count FROM products WHERE company_id = $1 AND quantity_in_stock <= low_stock_threshold\`,
      [companyId]
    );

    const totalValueResult = await db.query(
      \`SELECT COALESCE(SUM(quantity_in_stock * unit_price), 0) as total_inventory_value FROM products WHERE company_id = $1\`,
      [companyId]
    );

    const activeOrdersResult = await db.query(
      \`SELECT count(*) as active_sales_orders FROM sales_orders WHERE company_id = $1 AND status IN ('pending', 'processing')\`,
      [companyId]
    );

    res.json({
      low_stock_items: parseInt(lowStockResult.rows[0].low_stock_count, 10),
      total_inventory_value: parseFloat(totalValueResult.rows[0].total_inventory_value),
      active_sales_orders: parseInt(activeOrdersResult.rows[0].active_sales_orders, 10)
    });
  } catch (error) {
    next(error);
  }
});

// Get recent low stock alerts
router.get('/low-stock', async (req, res, next) => {
  try {
    const { companyId } = req.tenant;
    const result = await db.query(
      \`SELECT id, name, sku, quantity_in_stock, low_stock_threshold 
       FROM products 
       WHERE company_id = $1 AND quantity_in_stock <= low_stock_threshold
       ORDER BY quantity_in_stock ASC
       LIMIT 50\`,
      [companyId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

export default router;
