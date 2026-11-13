const express = require('express');
const {
  listPlacements,
  getMyPlacements,
  getPlacement,
  createPlacement,
  acceptOffer,
  rejectOffer,
  deletePlacement,
  getStats,
} = require('../controllers/placementController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

// ============ Specific routes BEFORE /:id ============
router.get('/me', authorize('student'), getMyPlacements);
router.get('/stats', authorize('admin'), getStats);

// ============ Admin: list all ============
router.get('/', authorize('admin'), listPlacements);

// ============ Create (admin or company) ============
router.post('/', authorize('admin', 'company'), createPlacement);

// ============ Generic :id routes ============
router.get('/:id', getPlacement);                       // auth inside controller
router.put('/:id/accept', authorize('student'), acceptOffer);
router.put('/:id/reject', authorize('student'), rejectOffer);
router.delete('/:id', authorize('admin'), deletePlacement);

module.exports = router;
