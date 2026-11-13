const express = require('express');
const {
  listCompanies,
  getMyProfile,
  getCompany,
  updateCompany,
  verifyCompany,
  getMyJobs,
} = require('../controllers/companyController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All company routes require authentication
router.use(authenticate);

// ============ Self routes (must come BEFORE /:id) ============
router.get('/me', authorize('company'), getMyProfile);
router.get('/me/jobs', authorize('company'), getMyJobs);

// ============ Admin routes ============
router.get('/', authorize('admin'), listCompanies);
router.put('/:id/verify', authorize('admin'), verifyCompany);

// ============ Any authenticated user ============
router.get('/:id', getCompany);
router.put('/:id', updateCompany);

module.exports = router;