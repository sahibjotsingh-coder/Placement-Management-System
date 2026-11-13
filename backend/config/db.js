const sql = require('mssql');
require('dotenv').config();

const config = {
  server: process.env.DB_SERVER,
  port: parseInt(process.env.DB_PORT),
  database: process.env.DB_DATABASE,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  options: {
    encrypt: process.env.DB_ENCRYPT === 'true',
    trustServerCertificate: process.env.DB_TRUST_SERVER_CERTIFICATE === 'true',
    enableArithAbort: true,
  },
  pool: {
    max: 10,
    min: 0,
    idleTimeoutMillis: 30000,
  },
};

let pool = null;

async function getPool() {
  try {
    if (!pool) {
      pool = await sql.connect(config);
      console.log('✅ Connected to SQL Server:', process.env.DB_DATABASE);
    }
    return pool;
  } catch (err) {
    console.error('❌ SQL Server connection failed:', err.message);
    throw err;
  }
}

async function closePool() {
  if (pool) {
    await pool.close();
    pool = null;
    console.log('🔌 SQL Server connection closed');
  }
}

module.exports = { sql, getPool, closePool };