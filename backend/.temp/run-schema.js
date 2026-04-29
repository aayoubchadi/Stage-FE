import pg from 'pg';
import { readFileSync } from 'fs';

const pool = new pg.Pool({
  host: 'localhost',
  port: 9100,
  database: 'stockpro_db',
  user: 'stockpro',
  password: 'stockpro123',
});

try {
  const schemaPath = './db/schema.sql';
  const schema = readFileSync(schemaPath, 'utf-8');
  
  console.log('Running schema migrations...');
  await pool.query(schema);
  console.log('✓ Schema migrations completed');
  
  // Verify demo_verifications table
  const { rows } = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'demo_verifications'
  `);
  
  if (rows.length > 0) {
    console.log('✓ demo_verifications table now exists');
  } else {
    console.log('✗ demo_verifications table still missing');
  }
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
  if (error.detail) console.error('Detail:', error.detail);
  process.exit(1);
}
