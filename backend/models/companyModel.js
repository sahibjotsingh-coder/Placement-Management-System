const { getPool, sql } = require('../config/db');

// ============================================
// GET ALL COMPANIES (with optional filters)
// ============================================
async function getAllCompanies({ isVerified, industry } = {}) {
  const pool = await getPool();
  const request = pool.request();

  const where = [];
  if (isVerified !== undefined) {
    where.push('c.is_verified = @isVerified');
    request.input('isVerified', sql.Bit, isVerified ? 1 : 0);
  }
  if (industry) {
    where.push('c.industry = @industry');
    request.input('industry', sql.NVarChar, industry);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const result = await request.query(`
    SELECT 
      c.company_id,
      c.company_name,
      c.website,
      c.industry,
      c.hr_name,
      c.hr_contact,
      c.is_verified,
      c.created_at,
      u.email,
      (SELECT COUNT(*) FROM job_postings j WHERE j.company_id = c.company_id) AS total_jobs,
      (SELECT COUNT(*) FROM placement_records pr WHERE pr.company_id = c.company_id) AS total_placements
    FROM companies c
    JOIN users u ON c.user_id = u.user_id
    ${whereClause}
    ORDER BY c.company_name ASC
  `);

  return result.recordset;
}

// ============================================
// GET COMPANY BY company_id (full profile)
// ============================================
async function getCompanyById(companyId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('companyId', sql.Int, companyId)
    .query(`
      SELECT 
        c.*,
        u.email,
        (SELECT COUNT(*) FROM job_postings j WHERE j.company_id = c.company_id) AS total_jobs,
        (SELECT COUNT(*) FROM placement_records pr WHERE pr.company_id = c.company_id) AS total_placements
      FROM companies c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.company_id = @companyId
    `);
  return result.recordset[0] || null;
}

// ============================================
// GET COMPANY BY user_id (for "me")
// ============================================
async function getCompanyByUserId(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT 
        c.*,
        u.email,
        (SELECT COUNT(*) FROM job_postings j WHERE j.company_id = c.company_id) AS total_jobs,
        (SELECT COUNT(*) FROM placement_records pr WHERE pr.company_id = c.company_id) AS total_placements
      FROM companies c
      JOIN users u ON c.user_id = u.user_id
      WHERE c.user_id = @userId
    `);
  return result.recordset[0] || null;
}

// ============================================
// UPDATE COMPANY PROFILE
// Note: No triggers on companies table, but we
// use the same UPDATE + SELECT pattern for consistency.
// ============================================
async function updateCompany(companyId, updates) {
  const pool = await getPool();

  // Step 1: Run the UPDATE
  const updateRequest = pool.request();
  updateRequest.input('companyId', sql.Int, companyId);

  const allowedFields = {
    company_name: sql.NVarChar,
    website: sql.NVarChar,
    industry: sql.NVarChar,
    description: sql.NVarChar,
    hr_name: sql.NVarChar,
    hr_contact: sql.NVarChar,
  };

  const setClauses = [];
  for (const [field, sqlType] of Object.entries(allowedFields)) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = @${field}`);
      updateRequest.input(field, sqlType, updates[field]);
    }
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  await updateRequest.query(`
    UPDATE companies
    SET ${setClauses.join(', ')}
    WHERE company_id = @companyId
  `);

  // Step 2: Fetch the updated row
  return await getCompanyById(companyId);
}

// ============================================
// VERIFY COMPANY (Admin only)
// ============================================
async function verifyCompany(companyId) {
  const pool = await getPool();

  // Step 1: Update
  const result = await pool
    .request()
    .input('companyId', sql.Int, companyId)
    .query(`
      UPDATE companies
      SET is_verified = 1
      WHERE company_id = @companyId
    `);

  if (result.rowsAffected[0] === 0) return null;

  // Step 2: Fetch updated row
  return await getCompanyById(companyId);
}

// ============================================
// GET JOBS POSTED BY A COMPANY
// ============================================
async function getCompanyJobs(companyId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('companyId', sql.Int, companyId)
    .query(`
      SELECT 
        j.*,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.job_id) AS application_count
      FROM job_postings j
      WHERE j.company_id = @companyId
      ORDER BY j.created_at DESC
    `);
  return result.recordset;
}

module.exports = {
  getAllCompanies,
  getCompanyById,
  getCompanyByUserId,
  updateCompany,
  verifyCompany,
  getCompanyJobs,
};