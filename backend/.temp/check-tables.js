import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 9100,
  database: 'stockpro_db',
  user: 'stockpro',
  password: 'stockpro123',
});

try {
  const { rows } = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'demo_verifications'
  `);
  
  if (rows.length > 0) {
    console.log('✓ demo_verifications table exists');
    const { rows: columns } = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'demo_verifications'
      ORDER BY ordinal_position
    `);
    console.log('\nTable structure:');
    columns.forEach(c => console.log(`  - ${c.column_name}: ${c.data_type}`));
  } else {
    console.log('✗ demo_verifications table does not exist');
  }
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
