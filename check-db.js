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

    // Count of users and roles
    const usersRes = await client.query('SELECT user_id, email, full_name, role_id FROM users');
    console.log('\n--- USERS ---');
    console.table(usersRes.rows);

    // Count of payment requests
    const prRes = await client.query('SELECT payment_request_id, request_number, applicant_user_id, manager_user_id, status_id, is_deleted FROM payment_requests');
    console.log('\n--- PAYMENT REQUESTS ---');
    console.table(prRes.rows);

    await client.end();
  } catch (err) {
    console.error('Error connecting or querying:', err);
  }
}

main();
