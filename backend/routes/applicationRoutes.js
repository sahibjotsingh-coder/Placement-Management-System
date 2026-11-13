const express = require('express');
const {
  createApplication,
  getMyApplications,
  getApplication,
  getHistory,
  updateStatus,
  withdrawApplication,
  getApplicationsForJob,
} = require('../controllers/applicationController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

// ============ Self routes (must come BEFORE /:id) ============
router.get('/me', authorize('student'), getMyApplications);

// ============ Job-specific (must come BEFORE /:id) ============
router.get('/job/:jobId', getApplicationsForJob);   // auth inside controller

// ============ Create (student only) ============
router.post('/', authorize('student'), createApplication);

// ============ Generic :id routes ============
router.get('/:id', getApplication);                 // auth inside controller
router.get('/:id/history', getHistory);             // auth inside controller
router.put('/:id/status', updateStatus);            // auth inside controller
router.delete('/:id', authorize('student'), withdrawApplication);

module.exports = router;