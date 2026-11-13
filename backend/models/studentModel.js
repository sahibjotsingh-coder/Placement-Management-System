const { getPool, sql } = require('../config/db');
const { checkEligibility } = require('../utils/eligibilityChecker');

// ============================================
// GET ALL STUDENTS (with optional filters)
// ============================================
async function getAllStudents({ deptId, minCgpa, isPlaced } = {}) {
  const pool = await getPool();
  const request = pool.request();

  const where = [];
  if (deptId) {
    where.push('s.dept_id = @deptId');
    request.input('deptId', sql.Int, deptId);
  }
  if (minCgpa !== undefined && minCgpa !== null) {
    where.push('s.cgpa >= @minCgpa');
    request.input('minCgpa', sql.Decimal(4, 2), minCgpa);
  }
  if (isPlaced !== undefined) {
    where.push('s.is_placed = @isPlaced');
    request.input('isPlaced', sql.Bit, isPlaced ? 1 : 0);
  }

  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const result = await request.query(`
    SELECT 
      s.student_id,
      s.roll_number,
      s.full_name,
      s.cgpa,
      s.active_backlogs,
      s.graduation_year,
      s.phone,
      s.is_placed,
      d.dept_code,
      d.dept_name,
      u.email
    FROM students s
    JOIN departments d ON s.dept_id = d.dept_id
    JOIN users u ON s.user_id = u.user_id
    ${whereClause}
    ORDER BY s.cgpa DESC
  `);

  return result.recordset;
}

// ============================================
// GET STUDENT BY student_id (full profile)
// ============================================
async function getStudentById(studentId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .query(`
      SELECT 
        s.*,
        d.dept_code,
        d.dept_name,
        u.email
      FROM students s
      JOIN departments d ON s.dept_id = d.dept_id
      JOIN users u ON s.user_id = u.user_id
      WHERE s.student_id = @studentId
    `);
  return result.recordset[0] || null;
}

// ============================================
// GET STUDENT BY user_id (for "me" lookups)
// ============================================
async function getStudentByUserId(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT 
        s.*,
        d.dept_code,
        d.dept_name,
        u.email
      FROM students s
      JOIN departments d ON s.dept_id = d.dept_id
      JOIN users u ON s.user_id = u.user_id
      WHERE s.user_id = @userId
    `);
  return result.recordset[0] || null;
}

// ============================================
// UPDATE STUDENT PROFILE
// 
// NOTE: We split this into UPDATE + SELECT because
// SQL Server forbids OUTPUT INSERTED.* on tables 
// that have an AFTER UPDATE trigger (which we do —
// trg_students_updated).
// ============================================
async function updateStudent(studentId, updates) {
  const pool = await getPool();

  // ----- Step 1: Build & run the UPDATE (no OUTPUT clause) -----
  const updateRequest = pool.request();
  updateRequest.input('studentId', sql.Int, studentId);

  const allowedFields = {
    full_name: sql.NVarChar,
    phone: sql.NVarChar,
    cgpa: sql.Decimal(4, 2),
    tenth_percentage: sql.Decimal(5, 2),
    twelfth_percentage: sql.Decimal(5, 2),
    active_backlogs: sql.Int,
    resume_url: sql.NVarChar,
    linkedin_url: sql.NVarChar,
    github_url: sql.NVarChar,
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
    UPDATE students
    SET ${setClauses.join(', ')}
    WHERE student_id = @studentId
  `);

  // ----- Step 2: Fetch the updated row (with joins for full profile) -----
  const selectResult = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .query(`
      SELECT 
        s.*,
        d.dept_code,
        d.dept_name,
        u.email
      FROM students s
      JOIN departments d ON s.dept_id = d.dept_id
      JOIN users u ON s.user_id = u.user_id
      WHERE s.student_id = @studentId
    `);

  return selectResult.recordset[0] || null;
}

// ============================================
// SKILLS
// ============================================
async function getStudentSkills(studentId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .query(`
      SELECT ss.skill_id, sk.skill_name, ss.proficiency
      FROM student_skills ss
      JOIN skills sk ON ss.skill_id = sk.skill_id
      WHERE ss.student_id = @studentId
      ORDER BY sk.skill_name
    `);
  return result.recordset;
}

// ============================================
// ADD SKILL
//
// Same trigger issue as UPDATE — avoid OUTPUT.
// Uses IF NOT EXISTS to prevent duplicates,
// then SELECTs the resulting row.
// ============================================
async function addStudentSkill(studentId, skillId, proficiency) {
  const pool = await getPool();

  // Step 1: Insert if not exists (no OUTPUT)
  await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .input('skillId', sql.Int, skillId)
    .input('proficiency', sql.NVarChar, proficiency || 'Intermediate')
    .query(`
      IF NOT EXISTS (
        SELECT 1 FROM student_skills 
        WHERE student_id = @studentId AND skill_id = @skillId
      )
      BEGIN
        INSERT INTO student_skills (student_id, skill_id, proficiency)
        VALUES (@studentId, @skillId, @proficiency)
      END
    `);

  // Step 2: Fetch the row
  const result = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .input('skillId', sql.Int, skillId)
    .query(`
      SELECT ss.skill_id, sk.skill_name, ss.proficiency
      FROM student_skills ss
      JOIN skills sk ON ss.skill_id = sk.skill_id
      WHERE ss.student_id = @studentId AND ss.skill_id = @skillId
    `);

  return result.recordset[0] || null;
}

// ============================================
// REMOVE SKILL
// ============================================
async function removeStudentSkill(studentId, skillId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .input('skillId', sql.Int, skillId)
    .query(`
      DELETE FROM student_skills 
      WHERE student_id = @studentId AND skill_id = @skillId
    `);
  return result.rowsAffected[0];
}

// ============================================
// MASTER SKILLS LIST
// ============================================
async function getAllSkills() {
  const pool = await getPool();
  const result = await pool
    .request()
    .query('SELECT skill_id, skill_name FROM skills ORDER BY skill_name');
  return result.recordset;
}

// ============================================
// ELIGIBLE JOBS
// Fetch all open jobs, filter using eligibilityChecker
// ============================================
async function getEligibleJobs(studentId) {
  const pool = await getPool();

  // 1. Fetch the student with department info
  const studentResult = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .query(`
      SELECT s.*, d.dept_code, d.dept_name
      FROM students s
      JOIN departments d ON s.dept_id = d.dept_id
      WHERE s.student_id = @studentId
    `);

  const student = studentResult.recordset[0];
  if (!student) throw new Error('Student not found');

  // 2. Fetch all open jobs with company info
  const jobsResult = await pool.request().query(`
    SELECT 
      j.*,
      c.company_name,
      c.industry
    FROM job_postings j
    JOIN companies c ON j.company_id = c.company_id
    WHERE j.status = 'Open'
    ORDER BY j.deadline ASC
  `);

  // 3. Filter using the eligibility checker
  const eligibleJobs = [];
  for (const job of jobsResult.recordset) {
    const { eligible } = checkEligibility(student, job);
    if (eligible) {
      eligibleJobs.push(job);
    }
  }

  return eligibleJobs;
}

// ============================================
// PLACEMENTS FOR A STUDENT
// ============================================
async function getStudentPlacements(studentId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('studentId', sql.Int, studentId)
    .query(`
      SELECT 
        pr.*,
        c.company_name,
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
// EXPORTS
// ============================================
module.exports = {
  getAllStudents,
  getStudentById,
  getStudentByUserId,
  updateStudent,
  getStudentSkills,
  addStudentSkill,
  removeStudentSkill,
  getAllSkills,
  getEligibleJobs,
  getStudentPlacements,
};