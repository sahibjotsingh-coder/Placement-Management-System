const jobModel = require('../models/jobModel');
const companyModel = require('../models/companyModel');
const { success, error } = require('../utils/response');

// ============================================
// GET /api/jobs — Browse all open jobs
// ============================================
async function listJobs(req, res) {
  try {
    const { status, companyId, jobType } = req.query;

    // Non-admins can only see Open jobs
    const requestedStatus = status || (req.user.role === 'admin' ? null : 'Open');

    const jobs = await jobModel.getAllJobs({
      status: requestedStatus,
      companyId: companyId ? parseInt(companyId) : undefined,
      jobType,
    });

    return success(res, jobs, `Found ${jobs.length} jobs`);
  } catch (err) {
    console.error('listJobs error:', err);
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/jobs/:id — Job details
// ============================================
async function getJob(req, res) {
  try {
    const { id } = req.params;
    const job = await jobModel.getJobById(parseInt(id));
    if (!job) return error(res, 'Job not found', 404);
    return success(res, job, 'Job fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// POST /api/jobs — Company creates a job
// ============================================
async function createJob(req, res) {
  try {
    // Company must have a profile
    const company = await companyModel.getCompanyByUserId(req.user.user_id);
    if (!company) return error(res, 'Company profile not found', 404);

    // Validation
    const { job_title, deadline } = req.body;
    if (!job_title) return error(res, 'job_title is required', 400);
    if (!deadline) return error(res, 'deadline is required', 400);

    // Deadline must be in the future
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    if (new Date(deadline) < today) {
      return error(res, 'Deadline must be in the future', 400);
    }

    // Create job with company_id from token (never trust client-supplied company_id)
    const job = await jobModel.createJob({
      ...req.body,
      company_id: company.company_id,
    });

    return success(res, job, 'Job posted successfully', 201);
  } catch (err) {
    console.error('createJob error:', err);
    return error(res, err.message, 500);
  }
}

// ============================================
// PUT /api/jobs/:id — Update job
// ============================================
async function updateJob(req, res) {
  try {
    const { id } = req.params;
    const jobId = parseInt(id);

    const job = await jobModel.getJobById(jobId);
    if (!job) return error(res, 'Job not found', 404);

    // Authorization: admin OR owning company
    const company = await companyModel.getCompanyByUserId(req.user.user_id);
    const isOwner = company && company.company_id === job.company_id;

    if (req.user.role !== 'admin' && !isOwner) {
      return error(res, 'You can only update jobs posted by your company', 403);
    }

    const updated = await jobModel.updateJob(jobId, req.body);
    return success(res, updated, 'Job updated');
  } catch (err) {
    return error(res, err.message, 400);
  }
}

// ============================================
// DELETE /api/jobs/:id — Cancel job (soft delete)
// ============================================
async function deleteJob(req, res) {
  try {
    const { id } = req.params;
    const jobId = parseInt(id);

    const job = await jobModel.getJobById(jobId);
    if (!job) return error(res, 'Job not found', 404);

    const company = await companyModel.getCompanyByUserId(req.user.user_id);
    const isOwner = company && company.company_id === job.company_id;

    if (req.user.role !== 'admin' && !isOwner) {
      return error(res, 'You can only cancel jobs posted by your company', 403);
    }

    await jobModel.cancelJob(jobId);
    return success(res, null, 'Job cancelled successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/jobs/:id/applications — Company views applicants
// ============================================
async function getApplications(req, res) {
  try {
    const { id } = req.params;
    const jobId = parseInt(id);

    const job = await jobModel.getJobById(jobId);
    if (!job) return error(res, 'Job not found', 404);

    const company = await companyModel.getCompanyByUserId(req.user.user_id);
    const isOwner = company && company.company_id === job.company_id;

    if (req.user.role !== 'admin' && !isOwner) {
      return error(res, 'You can only view applications for your own jobs', 403);
    }

    const apps = await jobModel.getJobApplications(jobId);
    return success(res, apps, `Found ${apps.length} applications`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

module.exports = {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getApplications,
};