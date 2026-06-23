const { Client } = require('pg');

async function main() {
  const client = new Client({
    host: 'localhost',
    port: 5432,
    user: 'prwm_admin',
    password: 'prwm_dev_2026',
    database: 'payment_request_db',
  });

  try {
    await client.connect();
    console.log('Connected to payment_request_db.');

    const sql = `
      SELECT 
        r.payment_request_id, 
        r.request_number, 
        r.applicant_user_id, 
        r.manager_user_id, 
        r.status_id, 
        r.is_deleted,
        u.full_name as applicant_name
      FROM payment_requests r
      LEFT JOIN users u ON r.applicant_user_id = u.user_id
      WHERE r.manager_user_id = 2 
        AND r.is_deleted = false 
        AND r.status_id IN (2, 3, 4, 5)
    `;
    const res = await client.query(sql);
    console.log('\n--- MATCHING REQUESTS ---');
    console.table(res.rows);

    await client.end();
  } catch (err) {
    console.error('Error:', err);
  }
}

main();
