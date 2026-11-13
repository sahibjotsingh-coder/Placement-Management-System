const applicationModel = require('../models/applicationModel');
const studentModel = require('../models/studentModel');
const jobModel = require('../models/jobModel');
const companyModel = require('../models/companyModel');
const { checkEligibility } = require('../utils/eligibilityChecker');
const { success, error } = require('../utils/response');

// ============================================
// POST /api/applications — Student applies
// ============================================
async function createApplication(req, res) {
  try {
    const { job_id } = req.body;
    if (!job_id) return error(res, 'job_id is required', 400);

    // Get student profile
    const student = await studentModel.getStudentByUserId(req.user.user_id);
    if (!student) return error(res, 'Student profile not found', 404);

    // Get job
    const job = await jobModel.getJobById(job_id);
    if (!job) return error(res, 'Job not found', 404);
    if (job.status !== 'Open') return error(res, 'Job is not open', 400);

    // Check if already applied
    const existing = await applicationModel.findApplication(student.student_id, job_id);
    if (existing) return error(res, 'You have already applied for this job', 409);

    // Check eligibility
    const { eligible, reasons } = checkEligibility(student, job);
    if (!eligible) {
      return error(res, `Not eligible: ${reasons.join('; ')}`, 400);
    }

    // Create application
    const application = await applicationModel.createApplication(student.student_id, job_id);
    return success(res, application, 'Application submitted successfully', 201);
  } catch (err) {
    console.error('createApplication error:', err);
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/applications/me — My applications
// ============================================
async function getMyApplications(req, res) {
  try {
    const student = await studentModel.getStudentByUserId(req.user.user_id);
    if (!student) return error(res, 'Student profile not found', 404);

    const applications = await applicationModel.getApplicationsByStudent(student.student_id);
    return success(res, applications, `Found ${applications.length} applications`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/applications/:id — Get one application
// ============================================
async function getApplication(req, res) {
  try {
    const { id } = req.params;
    const application = await applicationModel.getApplicationById(parseInt(id));
    if (!application) return error(res, 'Application not found', 404);

    // Authorization: student owner, admin, or owning company
    if (req.user.role === 'admin') {
      // allowed
    } else if (req.user.role === 'student') {
      const student = await studentModel.getStudentByUserId(req.user.user_id);
      if (!student || student.student_id !== application.student_id) {
        return error(res, 'Access denied', 403);
      }
    } else if (req.user.role === 'company') {
      const company = await companyModel.getCompanyByUserId(req.user.user_id);
      if (!company || company.company_id !== application.company_id) {
        return error(res, 'Access denied', 403);
      }
    }

    return success(res, application, 'Application fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/applications/:id/history — Status history
// ============================================
async function getHistory(req, res) {
  try {
    const { id } = req.params;
    const application = await applicationModel.getApplicationById(parseInt(id));
    if (!application) return error(res, 'Application not found', 404);

    // Authorization checks (same as getApplication)
    if (req.user.role === 'student') {
      const student = await studentModel.getStudentByUserId(req.user.user_id);
      if (!student || student.student_id !== application.student_id) {
        return error(res, 'Access denied', 403);
      }
    } else if (req.user.role === 'company') {
      const company = await companyModel.getCompanyByUserId(req.user.user_id);
      if (!company || company.company_id !== application.company_id) {
        return error(res, 'Access denied', 403);
      }
    }

    const history = await applicationModel.getApplicationHistory(parseInt(id));
    return success(res, history, 'History fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// PUT /api/applications/:id/status — Change status
// ============================================
async function updateStatus(req, res) {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const validStatuses = ['Applied', 'Shortlisted', 'Interviewed', 'Selected', 'Rejected', 'On Hold', 'Withdrawn'];
    if (!status || !validStatuses.includes(status)) {
      return error(res, `status must be one of: ${validStatuses.join(', ')}`, 400);
    }

    const application = await applicationModel.getApplicationById(parseInt(id));
    if (!application) return error(res, 'Application not found', 404);

    // Authorization: admin OR owning company
    if (req.user.role === 'company') {
      const company = await companyModel.getCompanyByUserId(req.user.user_id);
      if (!company || company.company_id !== application.company_id) {
        return error(res, 'You can only update applications for your own jobs', 403);
      }
    } else if (req.user.role !== 'admin') {
      return error(res, 'Only admin or the job\'s company can update status', 403);
    }

    const updated = await applicationModel.updateApplicationStatus(
      parseInt(id),
      status,
      req.user.user_id
    );

    return success(res, updated, 'Status updated');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// DELETE /api/applications/:id — Withdraw
// ============================================
async function withdrawApplication(req, res) {
  try {
    const { id } = req.params;
    const application = await applicationModel.getApplicationById(parseInt(id));
    if (!application) return error(res, 'Application not found', 404);

    // Only the student owner can withdraw
    const student = await studentModel.getStudentByUserId(req.user.user_id);
    if (!student || student.student_id !== application.student_id) {
      return error(res, 'You can only withdraw your own applications', 403);
    }

    // Can't withdraw if already Selected/Rejected
    if (['Selected', 'Rejected', 'Withdrawn'].includes(application.current_status)) {
      return error(res, `Cannot withdraw an application with status: ${application.current_status}`, 400);
    }

    await applicationModel.withdrawApplication(parseInt(id));
    return success(res, null, 'Application withdrawn');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/applications/job/:jobId — Applications for a job
// ============================================
async function getApplicationsForJob(req, res) {
  try {
    const { jobId } = req.params;

    const job = await jobModel.getJobById(parseInt(jobId));
    if (!job) return error(res, 'Job not found', 404);

    // Authorization: admin OR owning company
    if (req.user.role === 'company') {
      const company = await companyModel.getCompanyByUserId(req.user.user_id);
      if (!company || company.company_id !== job.company_id) {
        return error(res, 'You can only view applications for your own jobs', 403);
      }
    } else if (req.user.role !== 'admin') {
      return error(res, 'Access denied', 403);
    }

    const applications = await applicationModel.getApplicationsByJob(parseInt(jobId));
    return success(res, applications, `Found ${applications.length} applications`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

module.exports = {
  createApplication,
  getMyApplications,
  getApplication,
  getHistory,
  updateStatus,
  withdrawApplication,
  getApplicationsForJob,
};