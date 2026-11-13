const studentModel = require('../models/studentModel');
const { success, error } = require('../utils/response');

// ============================================
// GET /api/students
// Admin only — list all students with filters
// ============================================
async function listStudents(req, res) {
  try {
    const { deptId, minCgpa, isPlaced } = req.query;
    const students = await studentModel.getAllStudents({
      deptId: deptId ? parseInt(deptId) : undefined,
      minCgpa: minCgpa ? parseFloat(minCgpa) : undefined,
      isPlaced: isPlaced !== undefined ? isPlaced === 'true' : undefined,
    });
    return success(res, students, `Found ${students.length} students`);
  } catch (err) {
    console.error('listStudents error:', err);
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/students/:id
// Any authenticated user — get one profile
// ============================================
async function getStudent(req, res) {
  try {
    const { id } = req.params;
    const student = await studentModel.getStudentById(parseInt(id));
    if (!student) return error(res, 'Student not found', 404);

    // Get skills too
    const skills = await studentModel.getStudentSkills(student.student_id);

    return success(res, { ...student, skills }, 'Student fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/students/me
// Self — get own profile
// ============================================
async function getMyProfile(req, res) {
  try {
    const student = await studentModel.getStudentByUserId(req.user.user_id);
    if (!student) return error(res, 'Student profile not found', 404);

    const skills = await studentModel.getStudentSkills(student.student_id);

    return success(res, { ...student, skills }, 'My profile fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// PUT /api/students/:id
// Self or Admin — update profile
// ============================================
async function updateStudent(req, res) {
  try {
    const { id } = req.params;
    const studentId = parseInt(id);

    const student = await studentModel.getStudentById(studentId);
    if (!student) return error(res, 'Student not found', 404);

    // Authorization check
    if (
      req.user.role !== 'admin' &&
      student.user_id !== req.user.user_id
    ) {
      return error(res, 'You can only update your own profile', 403);
    }

    const updated = await studentModel.updateStudent(studentId, req.body);
    return success(res, updated, 'Profile updated');
  } catch (err) {
    return error(res, err.message, 400);
  }
}

// ============================================
// POST /api/students/me/skills
// Self — add skill
// ============================================
async function addSkill(req, res) {
  try {
    const { skill_id, proficiency } = req.body;
    if (!skill_id) return error(res, 'skill_id is required', 400);

    const student = await studentModel.getStudentByUserId(req.user.user_id);
    if (!student) return error(res, 'Student profile not found', 404);

    const result = await studentModel.addStudentSkill(
      student.student_id,
      skill_id,
      proficiency
    );
    return success(res, result, 'Skill added', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// DELETE /api/students/me/skills/:skillId
// Self — remove skill
// ============================================
async function removeSkill(req, res) {
  try {
    const { skillId } = req.params;

    const student = await studentModel.getStudentByUserId(req.user.user_id);
    if (!student) return error(res, 'Student profile not found', 404);

    const removed = await studentModel.removeStudentSkill(
      student.student_id,
      parseInt(skillId)
    );

    if (removed === 0) return error(res, 'Skill not found on profile', 404);
    return success(res, null, 'Skill removed');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/skills
// Any authenticated user — master list
// ============================================
async function listAllSkills(req, res) {
  try {
    const skills = await studentModel.getAllSkills();
    return success(res, skills, `Found ${skills.length} skills`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/students/me/eligible-jobs
// Self — jobs matching own eligibility
// ============================================
async function getEligibleJobs(req, res) {
  try {
    const student = await studentModel.getStudentByUserId(req.user.user_id);
    if (!student) return error(res, 'Student profile not found', 404);

    const jobs = await studentModel.getEligibleJobs(student.student_id);
    return success(res, jobs, `Found ${jobs.length} eligible jobs`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/students/:id/placements
// Self or Admin — placements for a student
// ============================================
async function getPlacements(req, res) {
  try {
    const { id } = req.params;
    const studentId = parseInt(id);

    const student = await studentModel.getStudentById(studentId);
    if (!student) return error(res, 'Student not found', 404);

    if (
      req.user.role !== 'admin' &&
      student.user_id !== req.user.user_id
    ) {
      return error(res, 'Access denied', 403);
    }

    const placements = await studentModel.getStudentPlacements(studentId);
    return success(res, placements, 'Placements fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

module.exports = {
  listStudents,
  getStudent,
  getMyProfile,
  updateStudent,
  addSkill,
  removeSkill,
  listAllSkills,
  getEligibleJobs,
  getPlacements,
};