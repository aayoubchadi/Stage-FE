import { query } from '../src/lib/db.js';
const email = 'admin@acme.local';
const companyIdResult = await query("SELECT id FROM companies WHERE slug = 'acme-logistics' LIMIT 1");
const companyId = companyIdResult.rows[0].id;
try {
  const { rows } = await query(
    `SELECT
       u.id,
       u.company_id,
       c.slug AS company_slug,
       c.name AS company_name,
       c.is_demo AS company_is_demo,
       c.demo_expires_at AS company_demo_expires_at,
       u.full_name,
       u.email::text AS email,
       u.password_hash,
       u.role,
       u.permissions,
       u.is_active
       ,sp.code AS plan_code
       ,sp.name AS plan_name
       ,sp.max_employees AS plan_max_employees
       ,sp.can_export_reports AS plan_can_export_reports
       ,sp.can_use_advanced_analytics AS plan_can_use_advanced_analytics
       ,sp.currency_code AS plan_currency_code
     FROM users u
     JOIN companies c ON c.id = u.company_id
     JOIN subscription_plans sp ON sp.id = c.subscription_plan_id
     WHERE u.email = $1
       AND u.company_id = $2
     LIMIT 2`,
    [email, companyId]
  );
  console.log(JSON.stringify(rows, null, 2));
} catch (error) {
  console.log(JSON.stringify({
    code: error.code,
    message: error.message,
    column: error.column,
    table: error.table,
    schema: error.schema,
    detail: error.detail,
    position: error.position,
    routine: error.routine,
  }, null, 2));
}
process.exit(0);