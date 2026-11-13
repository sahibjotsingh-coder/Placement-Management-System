const companyModel = require('../models/companyModel');
const { success, error } = require('../utils/response');

// ============================================
// GET /api/companies
// Admin only — list all companies
// ============================================
async function listCompanies(req, res) {
  try {
    const { isVerified, industry } = req.query;
    const companies = await companyModel.getAllCompanies({
      isVerified: isVerified !== undefined ? isVerified === 'true' : undefined,
      industry,
    });
    return success(res, companies, `Found ${companies.length} companies`);
  } catch (err) {
    console.error('listCompanies error:', err);
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/companies/me
// Company — get own profile
// ============================================
async function getMyProfile(req, res) {
  try {
    const company = await companyModel.getCompanyByUserId(req.user.user_id);
    if (!company) return error(res, 'Company profile not found', 404);
    return success(res, company, 'My company profile fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/companies/:id
// Any authenticated user — public profile
// ============================================
async function getCompany(req, res) {
  try {
    const { id } = req.params;
    const company = await companyModel.getCompanyById(parseInt(id));
    if (!company) return error(res, 'Company not found', 404);
    return success(res, company, 'Company fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// PUT /api/companies/:id
// Self or Admin — update profile
// ============================================
async function updateCompany(req, res) {
  try {
    const { id } = req.params;
    const companyId = parseInt(id);

    const company = await companyModel.getCompanyById(companyId);
    if (!company) return error(res, 'Company not found', 404);

    // Authorization: admin OR the company's own user
    if (
      req.user.role !== 'admin' &&
      company.user_id !== req.user.user_id
    ) {
      return error(res, 'You can only update your own company profile', 403);
    }

    const updated = await companyModel.updateCompany(companyId, req.body);
    return success(res, updated, 'Company profile updated');
  } catch (err) {
    return error(res, err.message, 400);
  }
}

// ============================================
// PUT /api/companies/:id/verify
// Admin only — verify a company
// ============================================
async function verifyCompany(req, res) {
  try {
    const { id } = req.params;
    const companyId = parseInt(id);

    const updated = await companyModel.verifyCompany(companyId);
    if (!updated) return error(res, 'Company not found', 404);

    return success(res, updated, 'Company verified successfully');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/companies/me/jobs
// Company — list own posted jobs
// ============================================
async function getMyJobs(req, res) {
  try {
    const company = await companyModel.getCompanyByUserId(req.user.user_id);
    if (!company) return error(res, 'Company profile not found', 404);

    const jobs = await companyModel.getCompanyJobs(company.company_id);
    return success(res, jobs, `Found ${jobs.length} jobs`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

module.exports = {
  listCompanies,
  getMyProfile,
  getCompany,
  updateCompany,
  verifyCompany,
  getMyJobs,
};