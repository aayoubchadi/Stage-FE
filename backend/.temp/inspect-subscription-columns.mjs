import { query } from '../src/lib/db.js';
const { rows } = await query("SELECT column_name FROM information_schema.columns WHERE table_schema='public' AND table_name='subscription_plans' ORDER BY ordinal_position");
console.log(rows.map((row) => row.column_name).join(','));
process.exit(0);