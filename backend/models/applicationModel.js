const { getPool, sql } = require('../config/db');

// ============================================
// CHECK IF APPLICATION EXISTS (student + job)
// ============================================
async function findApplication(studentId, jobId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .input('jobId', sql.Int, jobId)
    .query(`
      SELECT application_id, current_status
      FROM applications
      WHERE student_id = @studentId AND job_id = @jobId
    `);
  return result.recordset[0] || null;
}

// ============================================
// CREATE APPLICATION
// ============================================
async function createApplication(studentId, jobId) {
  const pool = await getPool();

  // Insert application
  const insertResult = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .input('jobId', sql.Int, jobId)
    .query(`
      INSERT INTO applications (student_id, job_id, current_status)
      VALUES (@studentId, @jobId, 'Applied');
      SELECT SCOPE_IDENTITY() AS application_id;
    `);

  const applicationId = insertResult.recordset[0].application_id;

  // Log status history
  await logStatusChange(applicationId, null, 'Applied', null);

  // Create notification for the student
  await pool
    .request()
    .input('userId', sql.Int, (await getStudentUserId(studentId)))
    .input('title', sql.NVarChar, 'Application Submitted')
    .input('message', sql.NVarChar, 'Your application has been submitted successfully.')
    .query(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (@userId, @title, @message)
    `);

  return await getApplicationById(applicationId);
}

// ============================================
// HELPER: Get user_id for a student
// ============================================
async function getStudentUserId(studentId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .query('SELECT user_id FROM students WHERE student_id = @studentId');
  return result.recordset[0]?.user_id;
}

// ============================================
// GET APPLICATION BY ID (with full details)
// ============================================
async function getApplicationById(applicationId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('applicationId', sql.Int, applicationId)
    .query(`
      SELECT 
        a.application_id,
        a.student_id,
        a.job_id,
        a.applied_at,
        a.current_status,
        s.full_name AS student_name,
        s.roll_number,
        s.cgpa,
        d.dept_code,
        u_student.email AS student_email,
        j.job_title,
        j.package_lpa,
        j.company_id,
        c.company_name
      FROM applications a
      JOIN students s ON a.student_id = s.student_id
      JOIN departments d ON s.dept_id = d.dept_id
      JOIN users u_student ON s.user_id = u_student.user_id
      JOIN job_postings j ON a.job_id = j.job_id
      JOIN companies c ON j.company_id = c.company_id
      WHERE a.application_id = @applicationId
    `);
  return result.recordset[0] || null;
}

// ============================================
// GET APPLICATIONS BY STUDENT
// ============================================
async function getApplicationsByStudent(studentId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .query(`
      SELECT 
        a.application_id,
        a.applied_at,
        a.current_status,
        j.job_id,
        j.job_title,
        j.package_lpa,
        j.location,
        j.deadline,
        c.company_id,
        c.company_name
      FROM applications a
      JOIN job_postings j ON a.job_id = j.job_id
      JOIN companies c ON j.company_id = c.company_id
      WHERE a.student_id = @studentId
      ORDER BY a.applied_at DESC
    `);
  return result.recordset;
}

// ============================================
// GET APPLICATIONS FOR A JOB
// ============================================
async function getApplicationsByJob(jobId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('jobId', sql.Int, jobId)
    .query(`
      SELECT 
        a.application_id,
        a.applied_at,
        a.current_status,
        s.student_id,
        s.full_name,
        s.roll_number,
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

// ============================================
// UPDATE APPLICATION STATUS
// ============================================
async function updateApplicationStatus(applicationId, newStatus, changedBy) {
  const pool = await getPool();

  // Get current status first
  const current = await pool
    .request()
    .input('applicationId', sql.Int, applicationId)
    .query('SELECT current_status FROM applications WHERE application_id = @applicationId');

  if (current.recordset.length === 0) return null;

  const oldStatus = current.recordset[0].current_status;

  // Update status
  await pool
    .request()
    .input('applicationId', sql.Int, applicationId)
    .input('newStatus', sql.NVarChar, newStatus)
    .query(`
      UPDATE applications
      SET current_status = @newStatus
      WHERE application_id = @applicationId
    `);

  // Log history
  await logStatusChange(applicationId, oldStatus, newStatus, changedBy);

  return await getApplicationById(applicationId);
}

// ============================================
// LOG STATUS CHANGE
// ============================================
async function logStatusChange(applicationId, oldStatus, newStatus, changedBy) {
  const pool = await getPool();
  await pool
    .request()
    .input('applicationId', sql.Int, applicationId)
    .input('oldStatus', sql.NVarChar, oldStatus)
    .input('newStatus', sql.NVarChar, newStatus)
    .input('changedBy', sql.Int, changedBy)
    .query(`
      INSERT INTO application_status_history 
        (application_id, old_status, new_status, changed_by)
      VALUES (@applicationId, @oldStatus, @newStatus, @changedBy)
    `);
}

// ============================================
// GET STATUS HISTORY
// ============================================
async function getApplicationHistory(applicationId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('applicationId', sql.Int, applicationId)
    .query(`
      SELECT 
        h.history_id,
        h.old_status,
        h.new_status,
        h.changed_at,
        u.email AS changed_by_email,
        u.role AS changed_by_role
      FROM application_status_history h
      LEFT JOIN users u ON h.changed_by = u.user_id
      WHERE h.application_id = @applicationId
      ORDER BY h.changed_at ASC
    `);
  return result.recordset;
}

// ============================================
// WITHDRAW APPLICATION (Student)
// ============================================
async function withdrawApplication(applicationId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('applicationId', sql.Int, applicationId)
    .query(`
      UPDATE applications
      SET current_status = 'Withdrawn'
      WHERE application_id = @applicationId
        AND current_status NOT IN ('Selected', 'Rejected', 'Withdrawn')
    `);

  if (result.rowsAffected[0] > 0) {
    await logStatusChange(applicationId, null, 'Withdrawn', null);
  }

  return result.rowsAffected[0];
}

module.exports = {
  findApplication,
  createApplication,
  getApplicationById,
  getApplicationsByStudent,
  getApplicationsByJob,
  updateApplicationStatus,
  getApplicationHistory,
  withdrawApplication,
  logStatusChange,
};