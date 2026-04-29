import { query } from '../src/lib/db.js';
await query("ALTER TABLE companies ADD COLUMN IF NOT EXISTS is_demo BOOLEAN NOT NULL DEFAULT FALSE");
await query("ALTER TABLE companies ADD COLUMN IF NOT EXISTS demo_expires_at TIMESTAMPTZ");
await query("UPDATE companies SET is_demo = COALESCE(is_demo, FALSE)");
await query("ALTER TABLE companies ALTER COLUMN is_demo SET DEFAULT FALSE");
await query("ALTER TABLE companies ALTER COLUMN is_demo SET NOT NULL");
console.log('migrated companies columns');
process.exit(0);