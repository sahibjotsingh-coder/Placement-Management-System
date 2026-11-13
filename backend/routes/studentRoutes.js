const express = require('express');
const {
  listStudents,
  getStudent,
  getMyProfile,
  updateStudent,
  addSkill,
  removeSkill,
  listAllSkills,
  getEligibleJobs,
  getPlacements,
} = require('../controllers/studentController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

// All student routes require authentication
router.use(authenticate);

// ============ Self routes (must come BEFORE /:id) ============
router.get('/me', getMyProfile);
router.get('/me/eligible-jobs', getEligibleJobs);
router.post('/me/skills', addSkill);
router.delete('/me/skills/:skillId', removeSkill);

// ============ Skills master list ============
router.get('/skills', listAllSkills);

// ============ Admin routes ============
router.get('/', authorize('admin'), listStudents);

// ============ Any authenticated user ============
router.get('/:id', getStudent);
router.put('/:id', updateStudent);
router.get('/:id/placements', getPlacements);

module.exports = router;