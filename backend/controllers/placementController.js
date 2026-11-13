const placementModel = require('../models/placementModel');
const studentModel = require('../models/studentModel');
const companyModel = require('../models/companyModel');
const jobModel = require('../models/jobModel');
const { success, error } = require('../utils/response');

// ============================================
// GET /api/placements — Admin only, list all
// ============================================
async function listPlacements(req, res) {
  try {
    const { companyId, studentId, minPackage, isAccepted } = req.query;
    const placements = await placementModel.getAllPlacements({
      companyId: companyId ? parseInt(companyId) : undefined,
      studentId: studentId ? parseInt(studentId) : undefined,
      minPackage: minPackage ? parseFloat(minPackage) : undefined,
      isAccepted: isAccepted !== undefined ? isAccepted === 'true' : undefined,
    });
    return success(res, placements, `Found ${placements.length} placements`);
  } catch (err) {
    console.error('listPlacements error:', err);
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/placements/me — Student's own placements
// ============================================
async function getMyPlacements(req, res) {
  try {
    const student = await studentModel.getStudentByUserId(req.user.user_id);
    if (!student) return error(res, 'Student profile not found', 404);

    const placements = await placementModel.getPlacementsByStudent(student.student_id);
    return success(res, placements, `Found ${placements.length} placements`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/placements/:id
// ============================================
async function getPlacement(req, res) {
  try {
    const { id } = req.params;
    const placement = await placementModel.getPlacementById(parseInt(id));
    if (!placement) return error(res, 'Placement not found', 404);

    // Authorization
    if (req.user.role === 'student') {
      const student = await studentModel.getStudentByUserId(req.user.user_id);
      if (!student || student.student_id !== placement.student_id) {
        return error(res, 'Access denied', 403);
      }
    } else if (req.user.role === 'company') {
      const company = await companyModel.getCompanyByUserId(req.user.user_id);
      if (!company || company.company_id !== placement.company_id) {
        return error(res, 'Access denied', 403);
      }
    }
    // admin = allowed

    return success(res, placement, 'Placement fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// POST /api/placements — Admin or Company
// ============================================
async function createPlacement(req, res) {
  try {
    const { student_id, job_id, package_lpa, offer_date, joining_date, offer_letter_url } = req.body;

    if (!student_id) return error(res, 'student_id is required', 400);
    if (!package_lpa) return error(res, 'package_lpa is required', 400);
    if (!offer_date) return error(res, 'offer_date is required', 400);

    // Determine company
    let companyId;
    if (req.user.role === 'company') {
      const company = await companyModel.getCompanyByUserId(req.user.user_id);
      if (!company) return error(res, 'Company profile not found', 404);
      companyId = company.company_id;
    } else if (req.user.role === 'admin') {
      if (!req.body.company_id) return error(res, 'company_id is required when admin creates', 400);
      companyId = req.body.company_id;
    } else {
      return error(res, 'Only admin or company can create placements', 403);
    }

    // Verify student exists
    const student = await studentModel.getStudentById(student_id);
    if (!student) return error(res, 'Student not found', 404);

    // If job_id provided, verify it belongs to this company
    if (job_id) {
      const job = await jobModel.getJobById(job_id);
      if (!job) return error(res, 'Job not found', 404);
      if (job.company_id !== companyId) {
        return error(res, 'Job does not belong to the specified company', 400);
      }
    }

    const placement = await placementModel.createPlacement({
      student_id,
      company_id: companyId,
      job_id,
      package_lpa,
      offer_date,
      joining_date,
      offer_letter_url,
      is_accepted: false,
    });

    return success(res, placement, 'Placement record created', 201);
  } catch (err) {
    console.error('createPlacement error:', err);
    return error(res, err.message, 500);
  }
}

// ============================================
// PUT /api/placements/:id/accept — Student
// ============================================
async function acceptOffer(req, res) {
  return updateOwnAcceptance(req, res, true);
}

// ============================================
// PUT /api/placements/:id/reject — Student
// ============================================
async function rejectOffer(req, res) {
  return updateOwnAcceptance(req, res, false);
}

// ============================================
// Shared helper for accept/reject
// ============================================
async function updateOwnAcceptance(req, res, accepted) {
  try {
    const { id } = req.params;
    const placement = await placementModel.getPlacementById(parseInt(id));
    if (!placement) return error(res, 'Placement not found', 404);

    // Only the student who received it can accept/reject
    const student = await studentModel.getStudentByUserId(req.user.user_id);
    if (!student || student.student_id !== placement.student_id) {
      return error(res, 'You can only respond to your own offers', 403);
    }

    const updated = await placementModel.updateAcceptance(parseInt(id), accepted);

    // Sync the student's is_placed flag
    await placementModel.syncStudentPlacedFlag(placement.student_id);

    return success(
      res,
      updated,
      accepted ? 'Offer accepted' : 'Offer rejected'
    );
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// DELETE /api/placements/:id — Admin only
// ============================================
async function deletePlacement(req, res) {
  try {
    const { id } = req.params;
    const placement = await placementModel.getPlacementById(parseInt(id));
    if (!placement) return error(res, 'Placement not found', 404);

    await placementModel.deletePlacement(parseInt(id));

    // Sync student's is_placed flag
    await placementModel.syncStudentPlacedFlag(placement.student_id);

    return success(res, null, 'Placement deleted');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/placements/stats — Admin only
// ============================================
async function getStats(req, res) {
  try {
    const stats = await placementModel.getPlacementStats();
    return success(res, stats, 'Placement stats fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

module.exports = {
  listPlacements,
  getMyPlacements,
  getPlacement,
  createPlacement,
  acceptOffer,
  rejectOffer,
  deletePlacement,
  getStats,
};
