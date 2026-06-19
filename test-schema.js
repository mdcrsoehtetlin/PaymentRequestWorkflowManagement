const { Client } = require('pg');

const client = new Client({
  user: 'prwm_admin',
  password: 'prwm_dev_2026',
  host: 'localhost',
  database: 'payment_request_db',
  port: 5432,
});

async function run() {
  try {
    await client.connect();
    
    const res = await client.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'payment_requests';
    `);
    console.log("Columns:", res.rows);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
