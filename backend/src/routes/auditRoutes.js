import express from 'express';
import { db } from '../lib/db.js';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireTenantAccess } from '../middleware/requireTenantAccess.js';
import { HttpError } from '../lib/httpError.js';

const router = express.Router();

router.use(requireAuth);
router.use(requireTenantAccess);

// Get all audits
router.get('/', async (req, res, next) => {
  try {
    const { companyId } = req.tenant;
    const result = await db.query(
      `SELECT sa.*, l.name as location_name 
       FROM stock_audits sa
       LEFT JOIN locations l ON sa.location_id = l.id
       WHERE sa.company_id = $1
       ORDER BY sa.created_at DESC`,
      [companyId]
    );
    res.json(result.rows);
  } catch (error) {
    next(error);
  }
});

// Create new audit
router.post('/', async (req, res, next) => {
  try {
    const { companyId } = req.tenant;
    const { location_id, scheduled_date, notes } = req.body;

    const result = await db.query(
      `INSERT INTO stock_audits (company_id, location_id, scheduled_date, notes)
       VALUES ($1, $2, $3, $4)
       RETURNING *`,
      [companyId, location_id, scheduled_date, notes]
    );
    res.status(201).json(result.rows[0]);
  } catch (error) {
    next(error);
  }
});

export default router;
