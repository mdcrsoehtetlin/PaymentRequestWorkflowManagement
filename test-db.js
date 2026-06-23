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
    
    const bd = await client.query('SELECT * FROM payment_breakdown_items LIMIT 1');
    console.log("Breakdowns:", bd.rows[0]);
    
    const rf = await client.query('SELECT * FROM receipt_files LIMIT 1');
    console.log("Receipts:", rf.rows[0]);

    const al = await client.query('SELECT * FROM approval_logs LIMIT 1');
    console.log("Logs:", al.rows[0]);
  } catch (err) {
    console.error(err);
  } finally {
    await client.end();
  }
}
run();
