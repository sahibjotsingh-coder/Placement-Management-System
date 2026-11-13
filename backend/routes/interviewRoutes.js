const express = require('express');
const {
  listRounds,
  addRound,
  updateRound,
  deleteRound,
  recordResult,
  getRoundResults,
  getApplicationResults,
  updateResult,
} = require('../controllers/interviewController');
const { authenticate, authorize } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

// ============ Rounds for a job ============
router.get('/job/:jobId/rounds', listRounds);              // any auth
router.post('/job/:jobId/rounds', authorize('company', 'admin'), addRound);

// ============ Round CRUD ============
router.put('/rounds/:roundId', authorize('company', 'admin'), updateRound);
router.delete('/rounds/:roundId', authorize('company', 'admin'), deleteRound);

// ============ Results ============
router.post('/rounds/:roundId/result', authorize('company', 'admin'), recordResult);
router.get('/rounds/:roundId/results', authorize('company', 'admin'), getRoundResults);
router.get('/application/:appId/results', getApplicationResults); // auth inside controller
router.put('/results/:resultId', authorize('company', 'admin'), updateResult);

module.exports = router;
