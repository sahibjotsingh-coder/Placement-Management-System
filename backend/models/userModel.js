const { getPool, sql } = require('../config/db');

async function findUserByEmail(email) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.NVarChar, email)
    .query('SELECT * FROM users WHERE email = @email');
  return result.recordset[0];
}

async function findUserById(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query('SELECT * FROM users WHERE user_id = @userId');
  return result.recordset[0];
}

async function createUser({ email, passwordHash, role }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('email', sql.NVarChar, email)
    .input('passwordHash', sql.NVarChar, passwordHash)
    .input('role', sql.NVarChar, role)
    .query(`
      INSERT INTO users (email, password_hash, role)
      OUTPUT INSERTED.*
      VALUES (@email, @passwordHash, @role)
    `);
  return result.recordset[0];
}

async function getStudentProfile(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query('SELECT * FROM students WHERE user_id = @userId');
  return result.recordset[0];
}

async function getCompanyProfile(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query('SELECT * FROM companies WHERE user_id = @userId');
  return result.recordset[0];
}

module.exports = {
  findUserByEmail,
  findUserById,
  createUser,
  getStudentProfile,
  getCompanyProfile,
};