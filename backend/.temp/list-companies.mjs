import { query } from '../src/lib/db.js';
const { rows } = await query("SELECT id, slug, name, is_demo FROM companies ORDER BY created_at ASC LIMIT 20");
console.log(JSON.stringify(rows, null, 2));
process.exit(0);