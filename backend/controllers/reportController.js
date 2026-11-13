const reportModel = require('../models/reportModel');
const { success, error } = require('../utils/response');

// ============================================
// GET /api/reports/dashboard
// ============================================
async function dashboard(req, res) {
  try {
    const stats = await reportModel.getDashboardStats();
    return success(res, stats, 'Dashboard stats fetched');
  } catch (err) {
    console.error('dashboard error:', err);
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/reports/placement-summary
// ============================================
async function placementSummary(req, res) {
  try {
    const data = await reportModel.getPlacementSummary();
    return success(res, data, 'Placement summary fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/reports/department-summary
// ============================================
async function departmentSummary(req, res) {
  try {
    const data = await reportModel.getDepartmentSummary();
    return success(res, data, 'Department summary fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/reports/package-stats
// ============================================
async function packageStats(req, res) {
  try {
    const data = await reportModel.getPackageStats();
    return success(res, data, 'Package stats fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/reports/top-recruiters?limit=5
// ============================================
async function topRecruiters(req, res) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 5;
    const data = await reportModel.getTopRecruiters(limit);
    return success(res, data, `Top ${limit} recruiters fetched`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/reports/eligibility-gap
// ============================================
async function eligibilityGap(req, res) {
  try {
    const data = await reportModel.getEligibilityGap();
    return success(res, data, 'Eligibility gap analysis fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/reports/upcoming-deadlines?days=14
// Any authenticated user
// ============================================
async function upcomingDeadlines(req, res) {
  try {
    const days = req.query.days ? parseInt(req.query.days) : 14;
    const data = await reportModel.getUpcomingDeadlines(days);
    return success(res, data, `Jobs with deadlines in next ${days} days`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/reports/student-status?deptId=&isPlaced=
// ============================================
async function studentStatus(req, res) {
  try {
    const { deptId, isPlaced } = req.query;
    const data = await reportModel.getStudentStatus({
      deptId: deptId ? parseInt(deptId) : undefined,
      isPlaced: isPlaced !== undefined ? isPlaced === 'true' : undefined,
    });
    return success(res, data, `Student status fetched`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

module.exports = {
  dashboard,
  placementSummary,
  departmentSummary,
  packageStats,
  topRecruiters,
  eligibilityGap,
  upcomingDeadlines,
  studentStatus,
};