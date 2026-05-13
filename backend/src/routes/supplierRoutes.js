import { Router } from 'express';
import { requireAuth } from '../middleware/requireAuth.js';
import { requireTenantAccess } from '../middleware/requireTenantAccess.js';
import db from '../lib/db.js';
import HttpError from '../lib/httpError.js';

const router = Router();

// Require authentication and valid tenant configuration for all routes.
router.use(requireAuth);
router.use(requireTenantAccess);

// GET /api/v1/suppliers
// List all suppliers for the company
router.get('/', async (req, res, next) => {
  try {
    const { rows } = await db.query(
      \`SELECT * FROM suppliers WHERE company_id = $1 ORDER BY name ASC\`,
      [req.tenant.companyId]
    );
    res.json({ suppliers: rows });
  } catch (error) {
    next(error);
  }
});

// GET /api/v1/suppliers/:id
router.get('/:id', async (req, res, next) => {
  try {
    const supplierId = req.params.id;
    const { rows } = await db.query(
      \`SELECT * FROM suppliers WHERE id = $1 AND company_id = $2\`,
      [supplierId, req.tenant.companyId]
    );

    if (rows.length === 0) {
      throw new HttpError(404, 'supplier_not_found', 'Supplier not found.');
    }

    res.json({ supplier: rows[0] });
  } catch (error) {
    next(error);
  }
});

// POST /api/v1/suppliers
// Create a new supplier
router.post('/', async (req, res, next) => {
  try {
    const { name, email, phone, address } = req.body;
    if (!name) {
      throw new HttpError(400, 'supplier_name_required', 'Supplier name is required.');
    }

    const { rows } = await db.query(
      \`INSERT INTO suppliers (company_id, name, email, phone, address)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *\`,
      [req.tenant.companyId, name, email || null, phone || null, address || null]
    );

    res.status(201).json({ supplier: rows[0] });
  } catch (error) {
    if (error.code === '23505') { // unique violation
      next(new HttpError(409, 'supplier_exists', 'A supplier with this name already exists.'));
    } else {
      next(error);
    }
  }
});

// PUT /api/v1/suppliers/:id
// Update an existing supplier
router.put('/:id', async (req, res, next) => {
  try {
    const supplierId = req.params.id;
    const { name, email, phone, address, is_active } = req.body;
    
    const { rows, rowCount } = await db.query(
      \`UPDATE suppliers 
       SET name = COALESCE($1, name),
           email = COALESCE($2, email),
           phone = COALESCE($3, phone),
           address = COALESCE($4, address),
           is_active = COALESCE($5, is_active)
       WHERE id = $6 AND company_id = $7
       RETURNING *\`,
      [name, email, phone, address, is_active, supplierId, req.tenant.companyId]
    );

    if (rowCount === 0) {
      throw new HttpError(404, 'supplier_not_found', 'Supplier not found.');
    }

    res.json({ supplier: rows[0] });
  } catch (error) {
    if (error.code === '23505') {
      next(new HttpError(409, 'conflict', 'Supplier name already exists.'));
    } else {
      next(error);
    }
  }
});

export default router;