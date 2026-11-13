const interviewModel = require('../models/interviewModel');
const jobModel = require('../models/jobModel');
const companyModel = require('../models/companyModel');
const applicationModel = require('../models/applicationModel');
const studentModel = require('../models/studentModel');
const notificationModel = require('../models/notificationModel');
const { getPool } = require('../config/db');
const { success, error } = require('../utils/response');

// ============================================
// Helper — Check if current user owns the job's company
// ============================================
async function ownsJob(req, job) {
  if (req.user.role === 'admin') return true;
  if (req.user.role !== 'company') return false;
  const company = await companyModel.getCompanyByUserId(req.user.user_id);
  return company && company.company_id === job.company_id;
}

// ============================================
// Helper — Format round details into a readable notification message
// ============================================
function formatRoundDetails(round) {
  // ============ Date ============
  let dateStr = 'TBD';
  if (round.round_date) {
    try {
      const d = new Date(round.round_date);
      dateStr = d.toLocaleDateString('en-GB', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        timeZone: 'UTC',
      });
    } catch {
      dateStr = 'TBD';
    }
  }

  // ============ Time ============
  let timeStr = '';
  if (round.round_time) {
    try {
      if (typeof round.round_time === 'string') {
        timeStr = round.round_time.slice(0, 5);
      } else {
        const d = new Date(round.round_time);
        const hh = String(d.getUTCHours()).padStart(2, '0');
        const mm = String(d.getUTCMinutes()).padStart(2, '0');
        timeStr = `${hh}:${mm}`;
      }
    } catch {
      timeStr = '';
    }
  }

  // ============ Location ============
  const locationInfo =
    round.mode === 'Online'
      ? round.venue_or_link
        ? `Link: ${round.venue_or_link}`
        : 'Online (link TBA)'
      : round.venue_or_link
      ? `Venue: ${round.venue_or_link}`
      : 'Venue TBA';

  return {
    dateTime: [dateStr, timeStr].filter(Boolean).join(' at '),
    locationInfo,
  };
}
// ============================================
// Helper — Notify all applicants + admins about a round
// ============================================
async function notifyRoundEvent({ job, round, eventType }) {
  // eventType: 'created' | 'updated' | 'cancelled'

  const { dateTime, locationInfo } = formatRoundDetails(round);

  // Build titles/messages based on event
  let studentTitle, studentMessage, adminTitle, adminMessage;

  if (eventType === 'created') {
    studentTitle = `New Round Scheduled: ${job.job_title}`;
    studentMessage =
      `Company ${job.company_name} has scheduled Round ${round.round_number} ` +
      `(${round.round_name}) for the "${job.job_title}" position.\n\n` +
      `📅 Date: ${dateTime}\n` +
      `📍 ${locationInfo}\n` +
      `🖥️ Mode: ${round.mode}\n\n` +
      `Please be ready on time.`;

    adminTitle = `Round Scheduled: ${job.company_name} - ${job.job_title}`;
    adminMessage =
      `Company ${job.company_name} has scheduled Round ${round.round_number} ` +
      `(${round.round_name}) for "${job.job_title}".\n\n` +
      `📅 Date: ${dateTime}\n` +
      `📍 ${locationInfo}\n` +
      `🖥️ Mode: ${round.mode}`;
  } else if (eventType === 'updated') {
    studentTitle = `Round Updated: ${job.job_title}`;
    studentMessage =
      `Round ${round.round_number} (${round.round_name}) details for "${job.job_title}" ` +
      `have been updated.\n\n` +
      `📅 Date: ${dateTime}\n` +
      `📍 ${locationInfo}\n` +
      `🖥️ Mode: ${round.mode}`;

    adminTitle = `Round Updated: ${job.company_name} - ${job.job_title}`;
    adminMessage = studentMessage;
  } else if (eventType === 'cancelled') {
    studentTitle = `Round Cancelled: ${job.job_title}`;
    studentMessage =
      `Round ${round.round_number} (${round.round_name}) for "${job.job_title}" ` +
      `has been cancelled by the company.`;

    adminTitle = `Round Cancelled: ${job.company_name} - ${job.job_title}`;
    adminMessage = studentMessage;
  }

  // 1. Notify all applicants
  const applicants = await applicationModel.getApplicationsByJob(job.job_id);
  let notifiedCount = 0;

  for (const app of applicants) {
    const student = await studentModel.getStudentById(app.student_id);
    if (student && student.user_id) {
      await notificationModel.createNotification({
        user_id: student.user_id,
        title: studentTitle,
        message: studentMessage,
      });
      notifiedCount++;
    }
  }

  // 2. Notify all admins
  const pool = await getPool();
  const admins = await pool
    .request()
    .query("SELECT user_id FROM users WHERE role = 'admin' AND is_active = 1");

  for (const admin of admins.recordset) {
    await notificationModel.createNotification({
      user_id: admin.user_id,
      title: adminTitle,
      message: adminMessage,
    });
  }

  return notifiedCount;
}

// ============================================
// GET /api/interviews/job/:jobId/rounds
// ============================================
async function listRounds(req, res) {
  try {
    const jobId = parseInt(req.params.jobId);
    const job = await jobModel.getJobById(jobId);
    if (!job) return error(res, 'Job not found', 404);

    const rounds = await interviewModel.getRoundsByJob(jobId);
    return success(res, rounds, `Found ${rounds.length} rounds`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// POST /api/interviews/job/:jobId/rounds
// Creates round + notifies applicants and admins
// ============================================
async function addRound(req, res) {
  try {
    const jobId = parseInt(req.params.jobId);
    const job = await jobModel.getJobById(jobId);
    if (!job) return error(res, 'Job not found', 404);

    if (!(await ownsJob(req, job))) {
      return error(res, 'You can only add rounds to your own jobs', 403);
    }

    const { round_name } = req.body;
    if (!round_name) return error(res, 'round_name is required', 400);

    // 1. Create the round
    const round = await interviewModel.createRound(jobId, req.body);

    // 2. Notify everyone
    const notified = await notifyRoundEvent({
      job,
      round,
      eventType: 'created',
    });

    return success(
      res,
      round,
      `Round added. ${notified} applicant(s) notified.`,
      201
    );
  } catch (err) {
    console.error('addRound error:', err);
    return error(res, err.message, 500);
  }
}

// ============================================
// PUT /api/interviews/rounds/:roundId
// Updates round + re-notifies if key details changed
// ============================================
async function updateRound(req, res) {
  try {
    const roundId = parseInt(req.params.roundId);
    const round = await interviewModel.getRoundById(roundId);
    if (!round) return error(res, 'Round not found', 404);

    const job = await jobModel.getJobById(round.job_id);
    if (!(await ownsJob(req, job))) {
      return error(res, 'You can only update your own rounds', 403);
    }

    const updated = await interviewModel.updateRound(roundId, req.body);

    // Detect significant changes
    const changes = ['round_date', 'round_time', 'mode', 'venue_or_link'].filter(
      (f) => req.body[f] !== undefined && req.body[f] !== round[f]
    );

    if (changes.length > 0) {
      await notifyRoundEvent({
        job,
        round: updated,
        eventType: 'updated',
      });
    }

    return success(res, updated, 'Round updated');
  } catch (err) {
    return error(res, err.message, 400);
  }
}

// ============================================
// DELETE /api/interviews/rounds/:roundId
// Deletes round + notifies cancellation
// ============================================
async function deleteRound(req, res) {
  try {
    const roundId = parseInt(req.params.roundId);
    const round = await interviewModel.getRoundById(roundId);
    if (!round) return error(res, 'Round not found', 404);

    const job = await jobModel.getJobById(round.job_id);
    if (!(await ownsJob(req, job))) {
      return error(res, 'You can only delete your own rounds', 403);
    }

    // Notify BEFORE deleting (so applicants list still valid)
    await notifyRoundEvent({
      job,
      round,
      eventType: 'cancelled',
    });

    await interviewModel.deleteRound(roundId);
    return success(res, null, 'Round deleted');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// POST /api/interviews/rounds/:roundId/result
// ============================================
async function recordResult(req, res) {
  try {
    const roundId = parseInt(req.params.roundId);
    const { application_id, result, remarks } = req.body;

    if (!application_id) return error(res, 'application_id is required', 400);

    const validResults = ['Pending', 'Pass', 'Fail'];
    if (result && !validResults.includes(result)) {
      return error(res, `result must be one of: ${validResults.join(', ')}`, 400);
    }

    const round = await interviewModel.getRoundById(roundId);
    if (!round) return error(res, 'Round not found', 404);

    const job = await jobModel.getJobById(round.job_id);
    if (!(await ownsJob(req, job))) {
      return error(res, 'You can only record results for your own rounds', 403);
    }

    const belongs = await interviewModel.applicationBelongsToJob(
      application_id,
      round.job_id
    );
    if (!belongs) {
      return error(res, 'This application does not belong to this job', 400);
    }

    const saved = await interviewModel.upsertResult({
      application_id,
      round_id: roundId,
      result: result || 'Pending',
      remarks,
    });

    // Bonus: notify the student about the result
    const application = await applicationModel.getApplicationById(application_id);
    if (application && application.student_email) {
      const student = await studentModel.getStudentById(application.student_id);
      if (student && student.user_id && result && result !== 'Pending') {
        await notificationModel.createNotification({
          user_id: student.user_id,
          title: `Round Result: ${job.job_title}`,
          message:
            `Your result for Round ${round.round_number} (${round.round_name}) ` +
            `has been recorded: ${result}.\n\n${remarks ? `Remarks: ${remarks}` : ''}`,
        });
      }
    }

    return success(res, saved, 'Result saved', 201);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/interviews/rounds/:roundId/results
// ============================================
async function getRoundResults(req, res) {
  try {
    const roundId = parseInt(req.params.roundId);
    const round = await interviewModel.getRoundById(roundId);
    if (!round) return error(res, 'Round not found', 404);

    const job = await jobModel.getJobById(round.job_id);
    if (!(await ownsJob(req, job))) {
      return error(res, 'Access denied', 403);
    }

    const results = await interviewModel.getResultsByRound(roundId);
    return success(res, results, `Found ${results.length} results`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/interviews/application/:appId/results
// ============================================
async function getApplicationResults(req, res) {
  try {
    const applicationId = parseInt(req.params.appId);

    const application = await applicationModel.getApplicationById(applicationId);
    if (!application) return error(res, 'Application not found', 404);

    // Authorization
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

    const results = await interviewModel.getResultsByApplication(applicationId);
    return success(res, results, 'Results fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// PUT /api/interviews/results/:resultId
// ============================================
async function updateResult(req, res) {
  try {
    const resultId = parseInt(req.params.resultId);
    const existing = await interviewModel.getResultWithContext(resultId);
    if (!existing) return error(res, 'Result not found', 404);

    const job = await jobModel.getJobById(existing.job_id);
    if (!(await ownsJob(req, job))) {
      return error(res, 'Access denied', 403);
    }

    if (req.body.result && !['Pending', 'Pass', 'Fail'].includes(req.body.result)) {
      return error(res, 'result must be Pending, Pass, or Fail', 400);
    }

    const updated = await interviewModel.updateResultById(resultId, req.body);
    return success(res, updated, 'Result updated');
  } catch (err) {
    return error(res, err.message, 400);
  }
}

module.exports = {
  listRounds,
  addRound,
  updateRound,
  deleteRound,
  recordResult,
  getRoundResults,
  getApplicationResults,
  updateResult,
};