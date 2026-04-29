import { query } from '../src/lib/db.js';
import { buildCompanyDemoSelect } from '../src/lib/companyCompatibility.js';
const email = 'admin@acme.local';
const { rows: companyRows } = await query("SELECT company_id FROM users WHERE email = $1 LIMIT 1", [email]);
const companyId = companyRows[0]?.company_id;
console.log('companyId', companyId);
const companyDemoSelect = await buildCompanyDemoSelect('c', 'company');
try {
  const { rows } = await query(
    `SELECT
       u.id,
       u.company_id,
       c.slug AS company_slug,
       c.name AS company_name,
       ${companyDemoSelect},
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