const { getPool, sql } = require('../config/db');

// ============================================
// GET ALL JOBS (with optional filters)
// ============================================
async function getAllJobs({ status, companyId, jobType } = {}) {
  const pool = await getPool();
  const request = pool.request();

  const where = [];
  if (status) {
    where.push('j.status = @status');
    request.input('status', sql.NVarChar, status);
  } else {
    where.push("j.status = 'Open'"); // default: only open jobs
  }
  if (companyId) {
    where.push('j.company_id = @companyId');
    request.input('companyId', sql.Int, companyId);
  }
  if (jobType) {
    where.push('j.job_type = @jobType');
    request.input('jobType', sql.NVarChar, jobType);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const result = await request.query(`
    SELECT 
      j.*,
      c.company_name,
      c.industry,
      c.is_verified,
      (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.job_id) AS application_count
    FROM job_postings j
    JOIN companies c ON j.company_id = c.company_id
    ${whereClause}
    ORDER BY j.deadline ASC
  `);

  return result.recordset;
}

// ============================================
// GET JOB BY ID (with rounds + applications count)
// ============================================
async function getJobById(jobId) {
  const pool = await getPool();

  // Get job with company info
  const jobResult = await pool
    .request()
    .input('jobId', sql.Int, jobId)
    .query(`
      SELECT 
        j.*,
        c.company_name,
        c.industry,
        c.website,
        c.is_verified,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.job_id) AS application_count
      FROM job_postings j
      JOIN companies c ON j.company_id = c.company_id
      WHERE j.job_id = @jobId
    `);

  const job = jobResult.recordset[0];
  if (!job) return null;

  // Get interview rounds
  const roundsResult = await pool
    .request()
    .input('jobId', sql.Int, jobId)
    .query(`
      SELECT round_id, round_number, round_name, round_date, round_time, mode, venue_or_link
      FROM interview_rounds
      WHERE job_id = @jobId
      ORDER BY round_number
    `);

  return { ...job, rounds: roundsResult.recordset };
}

// ============================================
// CREATE JOB
// ============================================
async function createJob(jobData) {
  const pool = await getPool();

  const request = pool.request();
  request.input('companyId', sql.Int, jobData.company_id);
  request.input('jobTitle', sql.NVarChar, jobData.job_title);
  request.input('jobDescription', sql.NVarChar, jobData.job_description || null);
  request.input('jobType', sql.NVarChar, jobData.job_type || 'Full-Time');
  request.input('packageLpa', sql.Decimal(6, 2), jobData.package_lpa || null);
  request.input('location', sql.NVarChar, jobData.location || null);
  request.input('minCgpa', sql.Decimal(4, 2), jobData.min_cgpa || 0);
  request.input('maxBacklogs', sql.Int, jobData.max_backlogs || 0);
  request.input('eligibleDepts', sql.NVarChar, jobData.eligible_depts || null);
  request.input('eligibleGradYear', sql.Int, jobData.eligible_grad_year || null);
  request.input('deadline', sql.Date, jobData.deadline);
  request.input('driveDate', sql.Date, jobData.drive_date || null);
  request.input('openings', sql.Int, jobData.openings || 1);

  // Insert without OUTPUT (to avoid trigger conflicts)
  const insertResult = await request.query(`
    INSERT INTO job_postings (
      company_id, job_title, job_description, job_type,
      package_lpa, location, min_cgpa, max_backlogs,
      eligible_depts, eligible_grad_year, deadline,
      drive_date, openings, status
    )
    VALUES (
      @companyId, @jobTitle, @jobDescription, @jobType,
      @packageLpa, @location, @minCgpa, @maxBacklogs,
      @eligibleDepts, @eligibleGradYear, @deadline,
      @driveDate, @openings, 'Open'
    );
    SELECT SCOPE_IDENTITY() AS job_id;
  `);

  const newJobId = insertResult.recordset[0].job_id;
  return await getJobById(newJobId);
}

// ============================================
// UPDATE JOB
// ============================================
async function updateJob(jobId, updates) {
  const pool = await getPool();

  const allowedFields = {
    job_title: sql.NVarChar,
    job_description: sql.NVarChar,
    job_type: sql.NVarChar,
    package_lpa: sql.Decimal(6, 2),
    location: sql.NVarChar,
    min_cgpa: sql.Decimal(4, 2),
    max_backlogs: sql.Int,
    eligible_depts: sql.NVarChar,
    eligible_grad_year: sql.Int,
    deadline: sql.Date,
    drive_date: sql.Date,
    openings: sql.Int,
    status: sql.NVarChar,
  };

  const request = pool.request();
  request.input('jobId', sql.Int, jobId);

  const setClauses = [];
  for (const [field, sqlType] of Object.entries(allowedFields)) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = @${field}`);
      request.input(field, sqlType, updates[field]);
    }
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  await request.query(`
    UPDATE job_postings
    SET ${setClauses.join(', ')}
    WHERE job_id = @jobId
  `);

  return await getJobById(jobId);
}

// ============================================
// SOFT DELETE (mark as Cancelled)
// ============================================
async function cancelJob(jobId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('jobId', sql.Int, jobId)
    .query(`
      UPDATE job_postings
      SET status = 'Cancelled'
      WHERE job_id = @jobId
    `);

  return result.rowsAffected[0];
}

// ============================================
// GET APPLICATIONS FOR A JOB
// ============================================
async function getJobApplications(jobId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('jobId', sql.Int, jobId)
    .query(`
      SELECT 
        a.application_id,
        a.current_status,
        a.applied_at,
        s.student_id,
        s.roll_number,
        s.full_name,
        s.cgpa,
        s.active_backlogs,
        d.dept_code,
        u.email
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN departments d ON s.dept_id = d.dept_id
      JOIN users u ON s.user_id = u.user_id
      WHERE a.job_id = @jobId
      ORDER BY a.applied_at DESC
    `);
  return result.recordset;
}

module.exports = {
  getAllJobs,
  getJobById,
  createJob,
  updateJob,
  cancelJob,
  getJobApplications,
};