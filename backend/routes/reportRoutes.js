const express = require('express');
const {
  dashboard,
  placementSummary,
  departmentSummary,
  packageStats,
  topRecruiters,
  eligibilityGap,
  upcomingDeadlines,
  studentStatus,
} = require('../controllers/reportController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

// ============ Admin-only analytics ============
router.get('/dashboard', authorize('admin'), dashboard);
router.get('/placement-summary', authorize('admin'), placementSummary);
router.get('/department-summary', authorize('admin'), departmentSummary);
router.get('/package-stats', authorize('admin'), packageStats);
router.get('/top-recruiters', authorize('admin'), topRecruiters);
router.get('/eligibility-gap', authorize('admin'), eligibilityGap);
router.get('/student-status', authorize('admin'), studentStatus);

// ============ Available to any authenticated user ============
router.get('/upcoming-deadlines', upcomingDeadlines);

module.exports = router;