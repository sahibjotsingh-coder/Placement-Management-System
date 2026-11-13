const { getPool, sql } = require('../config/db');

// ============================================
// GET ALL PLACEMENTS (with optional filters)
// ============================================
async function getAllPlacements({ companyId, studentId, minPackage, isAccepted } = {}) {
  const pool = await getPool();
  const request = pool.request();

  const where = [];
  if (companyId) {
    where.push('pr.company_id = @companyId');
    request.input('companyId', sql.Int, companyId);
  }
  if (studentId) {
    where.push('pr.student_id = @studentId');
    request.input('studentId', sql.Int, studentId);
  }
  if (minPackage !== undefined) {
    where.push('pr.package_lpa >= @minPackage');
    request.input('minPackage', sql.Decimal(6, 2), minPackage);
  }
  if (isAccepted !== undefined) {
    where.push('pr.is_accepted = @isAccepted');
    request.input('isAccepted', sql.Bit, isAccepted ? 1 : 0);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const result = await request.query(`
    SELECT 
      pr.record_id,
      pr.student_id,
      pr.company_id,
      pr.job_id,
      pr.package_lpa,
      pr.offer_date,
      pr.joining_date,
      pr.offer_letter_url,
      pr.is_accepted,
      pr.created_at,
      s.full_name AS student_name,
      s.roll_number,
      s.cgpa,
      d.dept_code,
      c.company_name,
      j.job_title
    FROM placement_records pr
    JOIN students s ON pr.student_id = s.student_id
    JOIN departments d ON s.dept_id = d.dept_id
    JOIN companies c ON pr.company_id = c.company_id
    LEFT JOIN job_postings j ON pr.job_id = j.job_id
    ${whereClause}
    ORDER BY pr.offer_date DESC, pr.created_at DESC
  `);

  return result.recordset;
}

// ============================================
// GET PLACEMENT BY ID (with full details)
// ============================================
async function getPlacementById(recordId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('recordId', sql.Int, recordId)
    .query(`
      SELECT 
        pr.*,
        s.full_name AS student_name,
        s.roll_number,
        s.cgpa,
        s.user_id AS student_user_id,
        d.dept_code,
        d.dept_name,
        u.email AS student_email,
        c.company_name,
        c.industry AS company_industry,
        c.user_id AS company_user_id,
        j.job_title,
        j.package_lpa AS job_package_lpa
      FROM placement_records pr
      JOIN students s ON pr.student_id = s.student_id
      JOIN departments d ON s.dept_id = d.dept_id
      JOIN users u ON s.user_id = u.user_id
      JOIN companies c ON pr.company_id = c.company_id
      LEFT JOIN job_postings j ON pr.job_id = j.job_id
      WHERE pr.record_id = @recordId
    `);
  return result.recordset[0] || null;
}

// ============================================
// GET PLACEMENTS FOR A STUDENT
// ============================================
async function getPlacementsByStudent(studentId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .query(`
      SELECT 
        pr.record_id,
        pr.package_lpa,
        pr.offer_date,
        pr.joining_date,
        pr.offer_letter_url,
        pr.is_accepted,
        c.company_id,
        c.company_name,
        c.industry,
        j.job_title
      FROM placement_records pr
      JOIN companies c ON pr.company_id = c.company_id
      LEFT JOIN job_postings j ON pr.job_id = j.job_id
      WHERE pr.student_id = @studentId
      ORDER BY pr.offer_date DESC
    `);
  return result.recordset;
}

// ============================================
// CREATE PLACEMENT RECORD
// ============================================
async function createPlacement(data) {
  const pool = await getPool();

  const result = await pool
    .request()
    .input('studentId', sql.Int, data.student_id)
    .input('companyId', sql.Int, data.company_id)
    .input('jobId', sql.Int, data.job_id || null)
    .input('packageLpa', sql.Decimal(6, 2), data.package_lpa)
    .input('offerDate', sql.Date, data.offer_date)
    .input('joiningDate', sql.Date, data.joining_date || null)
    .input('offerLetterUrl', sql.NVarChar, data.offer_letter_url || null)
    .input('isAccepted', sql.Bit, data.is_accepted ? 1 : 0)
    .query(`
      INSERT INTO placement_records 
        (student_id, company_id, job_id, package_lpa, offer_date, joining_date, offer_letter_url, is_accepted)
      VALUES 
        (@studentId, @companyId, @jobId, @packageLpa, @offerDate, @joiningDate, @offerLetterUrl, @isAccepted);
      SELECT SCOPE_IDENTITY() AS record_id;
    `);

  const recordId = result.recordset[0].record_id;
  return await getPlacementById(recordId);
}

// ============================================
// ACCEPT / REJECT OFFER
// ============================================
async function updateAcceptance(recordId, isAccepted) {
  const pool = await getPool();

  await pool
    .request()
    .input('recordId', sql.Int, recordId)
    .input('isAccepted', sql.Bit, isAccepted ? 1 : 0)
    .query(`
      UPDATE placement_records
      SET is_accepted = @isAccepted
      WHERE record_id = @recordId
    `);

  return await getPlacementById(recordId);
}

// ============================================
// UPDATE STUDENT is_placed FLAG
// Called when a placement is accepted.
// ============================================
async function syncStudentPlacedFlag(studentId) {
  const pool = await getPool();
  await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .query(`
      UPDATE students
      SET is_placed = CASE 
        WHEN EXISTS (
          SELECT 1 FROM placement_records 
          WHERE student_id = @studentId AND is_accepted = 1
        ) THEN 1 ELSE 0 
      END
      WHERE student_id = @studentId
    `);
}

// ============================================
// DELETE PLACEMENT (admin only, rare)
// ============================================
async function deletePlacement(recordId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('recordId', sql.Int, recordId)
    .query('DELETE FROM placement_records WHERE record_id = @recordId');
  return result.rowsAffected[0];
}

// ============================================
// STATS
// ============================================
async function getPlacementStats() {
  const pool = await getPool();

  const stats = await pool.request().query(`
    SELECT 
      COUNT(*) AS total_offers,
      SUM(CASE WHEN is_accepted = 1 THEN 1 ELSE 0 END) AS accepted_offers,
      AVG(package_lpa) AS avg_package,
      MAX(package_lpa) AS highest_package,
      MIN(package_lpa) AS lowest_package
    FROM placement_records
  `);

  const byDept = await pool.request().query(`
    SELECT 
      d.dept_code,
      d.dept_name,
      COUNT(pr.record_id) AS offer_count,
      COUNT(DISTINCT pr.student_id) AS students_placed,
      AVG(pr.package_lpa) AS avg_package
    FROM placement_records pr
    JOIN students s ON pr.student_id = s.student_id
    JOIN departments d ON s.dept_id = d.dept_id
    GROUP BY d.dept_code, d.dept_name
    ORDER BY students_placed DESC
  `);

  const byCompany = await pool.request().query(`
    SELECT TOP 10
      c.company_name,
      COUNT(pr.record_id) AS offer_count,
      AVG(pr.package_lpa) AS avg_package,
      MAX(pr.package_lpa) AS highest_package
    FROM placement_records pr
    JOIN companies c ON pr.company_id = c.company_id
    GROUP BY c.company_name
    ORDER BY offer_count DESC
  `);

  return {
    summary: stats.recordset[0],
    byDepartment: byDept.recordset,
    byCompany: byCompany.recordset,
  };
}

module.exports = {
  getAllPlacements,
  getPlacementById,
  getPlacementsByStudent,
  createPlacement,
  updateAcceptance,
  syncStudentPlacedFlag,
  deletePlacement,
  getPlacementStats,
};