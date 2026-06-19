const { execSync } = require('child_process');
const { Client } = require('pg');
const fs = require('fs');
const path = require('path');

async function setup() {
  console.log('=========================================');
  console.log(' PRWM Automated Environment Setup Script');
  console.log('=========================================\n');

  try {
    // 1. Install Backend Dependencies
    console.log('📦 [1/3] Installing Backend Dependencies...');
    execSync('npm install', { stdio: 'inherit', cwd: __dirname });
    console.log('✅ Backend dependencies installed successfully.\n');

    // 2. Install Frontend Dependencies
    console.log('📦 [2/3] Installing Frontend Dependencies...');
    const frontendPath = path.join(__dirname, 'frontend');
    if (fs.existsSync(frontendPath)) {
      execSync('npm install', { stdio: 'inherit', cwd: frontendPath });
      console.log('✅ Frontend dependencies installed successfully.\n');
    } else {
      console.log('⚠️ Frontend directory not found. Skipping frontend install.\n');
    }

    // 3. Database Restoration & Fixes
    console.log('🗄️ [3/3] Restoring Database and Fixing Permissions...');
    const client = new Client({
      host: 'localhost',
      port: 5432,
      user: 'prwm_admin',
      password: 'prwm_dev_2026',
      database: 'payment_request_db',
    });

    await client.connect();
    console.log('   -> Connected to PostgreSQL as prwm_admin');

    console.log('   -> Dropping existing schema to prevent ownership conflicts...');
    await client.query('DROP SCHEMA IF EXISTS public CASCADE; CREATE SCHEMA public;');

    const sqlPath = path.join(__dirname, 'docs', 'core_ja', 'payment_request_db_backup.sql');
    if (fs.existsSync(sqlPath)) {
      console.log('   -> Executing payment_request_db_backup.sql...');
      let sql = fs.readFileSync(sqlPath, 'utf8');
      
      // Auto-fix any OWNER TO postgres statements to prevent permission denied errors
      sql = sql.replace(/ALTER TABLE public\..* OWNER TO postgres;/g, '-- ALTER TABLE OWNER REMOVED');
      
      await client.query(sql);
      console.log('✅ Database restoration completed successfully.\n');
    } else {
      console.log('⚠️ SQL Backup file not found at docs/core_ja/payment_request_db_backup.sql.\n');
    }

    await client.end();

    console.log('=========================================');
    console.log(' 🎉 Setup Complete! You are ready to go.');
    console.log('=========================================');
    console.log('\nTo start the application:');
    console.log('1. Backend : npm run start:dev');
    console.log('2. Frontend: cd frontend && npm run dev');

  } catch (error) {
    console.error('\n❌ Setup failed:', error.message);
    process.exit(1);
  }
}

setup();
