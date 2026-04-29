import pg from 'pg';

const pool = new pg.Pool({
  host: 'localhost',
  port: 9100,
  database: 'stockpro_db',
  user: 'stockpro',
  password: 'stockpro123',
});

try {
  console.log('Creating demo_verifications table...');
  
  // Create the table with minimal DDL
  await pool.query(`
    CREATE TABLE IF NOT EXISTS demo_verifications (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      order_id VARCHAR(120) NOT NULL UNIQUE,
      authorization_id VARCHAR(120),
      status VARCHAR(30) NOT NULL DEFAULT 'pending',
      company_id UUID REFERENCES companies(id) ON DELETE SET NULL,
      admin_email CITEXT,
      raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      verified_at TIMESTAMPTZ,
      updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      CONSTRAINT ck_demo_verifications_status CHECK (
        status IN ('pending', 'authorized', 'voided', 'verified', 'failed')
      )
    )
  `);
  
  console.log('✓ demo_verifications table created');
  
  // Create indexes
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_demo_verifications_status 
    ON demo_verifications(status, created_at)
  `);
  console.log('✓ Status index created');
  
  await pool.query(`
    CREATE INDEX IF NOT EXISTS idx_demo_verifications_company 
    ON demo_verifications(company_id)
  `);
  console.log('✓ Company index created');
  
  // Verify table exists
  const { rows } = await pool.query(`
    SELECT table_name 
    FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name = 'demo_verifications'
  `);
  
  if (rows.length > 0) {
    console.log('✓ demo_verifications table confirmed');
  }
  
  await pool.end();
} catch (error) {
  console.error('Error:', error.message);
  if (error.detail) console.error('Detail:', error.detail);
  process.exit(1);
}
