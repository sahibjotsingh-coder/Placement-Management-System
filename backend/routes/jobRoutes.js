const express = require('express');
const {
  listJobs,
  getJob,
  createJob,
  updateJob,
  deleteJob,
  getApplications,
} = require('../controllers/jobController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All job routes require authentication
router.use(authenticate);

// ============ Browse & view (any authenticated user) ============
router.get('/', listJobs);
router.get('/:id', getJob);
router.get('/:id/applications', getApplications);   // owner check inside controller

// ============ Company-only ============
router.post('/', authorize('company'), createJob);
router.put('/:id', updateJob);                      // owner check inside controller
router.delete('/:id', deleteJob);                   // owner check inside controller

module.exports = router;