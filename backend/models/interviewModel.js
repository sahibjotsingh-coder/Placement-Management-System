const { getPool, sql } = require('../config/db');

// ============================================
// GET ALL ROUNDS FOR A JOB
// ============================================
async function getRoundsByJob(jobId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('jobId', sql.Int, jobId)
    .query(`
      SELECT 
        r.round_id,
        r.job_id,
        r.round_number,
        r.round_name,
        r.round_date,
        r.round_time,
        r.mode,
        r.venue_or_link,
        (SELECT COUNT(*) 
         FROM round_results rr 
         WHERE rr.round_id = r.round_id) AS result_count
      FROM interview_rounds r
      WHERE r.job_id = @jobId
      ORDER BY r.round_number
    `);
  return result.recordset;
}

// ============================================
// GET ONE ROUND
// ============================================
async function getRoundById(roundId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('roundId', sql.Int, roundId)
    .query(`
      SELECT r.*, j.company_id, j.job_title
      FROM interview_rounds r
      JOIN job_postings j ON r.job_id = j.job_id
      WHERE r.round_id = @roundId
    `);
  return result.recordset[0] || null;
}

// ============================================
// CREATE ROUND
// ============================================
async function createRound(jobId, data) {
  const pool = await getPool();

  // Auto-assign round_number if not provided
  let roundNumber = data.round_number;
  if (!roundNumber) {
    const maxResult = await pool
      .request()
      .input('jobId', sql.Int, jobId)
      .query('SELECT ISNULL(MAX(round_number), 0) AS max_num FROM interview_rounds WHERE job_id = @jobId');
    roundNumber = maxResult.recordset[0].max_num + 1;
  }

  const result = await pool
    .request()
    .input('jobId', sql.Int, jobId)
    .input('roundNumber', sql.Int, roundNumber)
    .input('roundName', sql.NVarChar, data.round_name)
    .input('roundDate', sql.Date, data.round_date || null)
    .input('roundTime', sql.VarChar, data.round_time || null)
    .input('mode', sql.NVarChar, data.mode || 'Offline')
    .input('venueOrLink', sql.NVarChar, data.venue_or_link || null)
    .query(`
      INSERT INTO interview_rounds 
        (job_id, round_number, round_name, round_date, round_time, mode, venue_or_link)
      VALUES 
        (@jobId, @roundNumber, @roundName, @roundDate, @roundTime, @mode, @venueOrLink);
      SELECT SCOPE_IDENTITY() AS round_id;
    `);

  const roundId = result.recordset[0].round_id;
  return await getRoundById(roundId);
}

// ============================================
// UPDATE ROUND
// ============================================
async function updateRound(roundId, updates) {
  const pool = await getPool();

  const allowedFields = {
    round_name: sql.NVarChar,
    round_date: sql.Date,
    round_time: sql.VarChar,
    mode: sql.NVarChar,
    venue_or_link: sql.NVarChar,
  };

  const request = pool.request();
  request.input('roundId', sql.Int, roundId);

  const setClauses = [];
  for (const [field, sqlType] of Object.entries(allowedFields)) {
    if (updates[field] !== undefined) {
      setClauses.push(`${field} = @${field}`);
      request.input(field, sqlType, updates[field]);
    }
  }

  if (setClauses.length === 0) {
    throw new Error('No valid fields to update');
  }

  await request.query(`
    UPDATE interview_rounds
    SET ${setClauses.join(', ')}
    WHERE round_id = @roundId
  `);

  return await getRoundById(roundId);
}

// ============================================
// DELETE ROUND
// ============================================
async function deleteRound(roundId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('roundId', sql.Int, roundId)
    .query('DELETE FROM interview_rounds WHERE round_id = @roundId');
  return result.rowsAffected[0];
}

// ============================================
// CHECK IF APPLICATION BELONGS TO A JOB
// (for validation before recording results)
// ============================================
async function applicationBelongsToJob(applicationId, jobId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('applicationId', sql.Int, applicationId)
    .input('jobId', sql.Int, jobId)
    .query(`
      SELECT 1 AS ok FROM applications
      WHERE application_id = @applicationId AND job_id = @jobId
    `);
  return result.recordset.length > 0;
}

// ============================================
// RECORD / UPSERT RESULT
// For a given round + application, insert or update the result.
// ============================================
async function upsertResult({ application_id, round_id, result, remarks }) {
  const pool = await getPool();

  // Try to insert; if unique constraint hit, update instead
  await pool
    .request()
    .input('applicationId', sql.Int, application_id)
    .input('roundId', sql.Int, round_id)
    .input('result', sql.NVarChar, result || 'Pending')
    .input('remarks', sql.NVarChar, remarks || null)
    .query(`
      MERGE round_results AS target
      USING (SELECT @applicationId AS application_id, @roundId AS round_id) AS source
        ON target.application_id = source.application_id 
           AND target.round_id = source.round_id
      WHEN MATCHED THEN
        UPDATE SET result = @result, remarks = @remarks, updated_at = SYSDATETIME()
      WHEN NOT MATCHED THEN
        INSERT (application_id, round_id, result, remarks)
        VALUES (@applicationId, @roundId, @result, @remarks);
    `);

  return await getResultByApplicationAndRound(application_id, round_id);
}

// ============================================
// GET RESULT BY APPLICATION + ROUND
// ============================================
async function getResultByApplicationAndRound(applicationId, roundId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('applicationId', sql.Int, applicationId)
    .input('roundId', sql.Int, roundId)
    .query(`
      SELECT 
        rr.result_id,
        rr.application_id,
        rr.round_id,
        rr.result,
        rr.remarks,
        rr.updated_at,
        r.round_number,
        r.round_name
      FROM round_results rr
      JOIN interview_rounds r ON rr.round_id = r.round_id
      WHERE rr.application_id = @applicationId AND rr.round_id = @roundId
    `);
  return result.recordset[0] || null;
}

// ============================================
// GET ALL RESULTS FOR AN APPLICATION
// (with round info)
// ============================================
async function getResultsByApplication(applicationId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('applicationId', sql.Int, applicationId)
    .query(`
      SELECT 
        rr.result_id,
        rr.application_id,
        rr.round_id,
        rr.result,
        rr.remarks,
        rr.updated_at,
        r.round_number,
        r.round_name,
        r.round_date,
        r.round_time,
        r.mode,
        r.venue_or_link
      FROM round_results rr
      JOIN interview_rounds r ON rr.round_id = r.round_id
      WHERE rr.application_id = @applicationId
      ORDER BY r.round_number
    `);
  return result.recordset;
}

// ============================================
// GET ALL RESULTS FOR A ROUND
// (with student info)
// ============================================
async function getResultsByRound(roundId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('roundId', sql.Int, roundId)
    .query(`
      SELECT 
        rr.result_id,
        rr.result,
        rr.remarks,
        rr.updated_at,
        a.application_id,
        s.student_id,
        s.full_name,
        s.roll_number,
        s.cgpa
      FROM round_results rr
      JOIN applications a ON rr.application_id = a.application_id
      JOIN students s ON a.student_id = s.student_id
      WHERE rr.round_id = @roundId
      ORDER BY s.full_name
    `);
  return result.recordset;
}

// ============================================
// UPDATE RESULT BY ID
// ============================================
async function updateResultById(resultId, updates) {
  const pool = await getPool();

  const request = pool.request();
  request.input('resultId', sql.Int, resultId);

  const setClauses = [];
  if (updates.result !== undefined) {
    setClauses.push('result = @result');
    request.input('result', sql.NVarChar, updates.result);
  }
  if (updates.remarks !== undefined) {
    setClauses.push('remarks = @remarks');
    request.input('remarks', sql.NVarChar, updates.remarks);
  }

  if (setClauses.length === 0) throw new Error('No fields to update');

  await request.query(`
    UPDATE round_results
    SET ${setClauses.join(', ')}
    WHERE result_id = @resultId
  `);

  const selectResult = await pool
    .request()
    .input('resultId', sql.Int, resultId)
    .query('SELECT * FROM round_results WHERE result_id = @resultId');

  return selectResult.recordset[0] || null;
}

// ============================================
// GET RESULT BY ID (with round info for auth check)
// ============================================
async function getResultWithContext(resultId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('resultId', sql.Int, resultId)
    .query(`
      SELECT 
        rr.*,
        r.job_id,
        j.company_id
      FROM round_results rr
      JOIN interview_rounds r ON rr.round_id = r.round_id
      JOIN job_postings j ON r.job_id = j.job_id
      WHERE rr.result_id = @resultId
    `);
  return result.recordset[0] || null;
}

module.exports = {
  getRoundsByJob,
  getRoundById,
  createRound,
  updateRound,
  deleteRound,
  applicationBelongsToJob,
  upsertResult,
  getResultByApplicationAndRound,
  getResultsByApplication,
  getResultsByRound,
  updateResultById,
  getResultWithContext,
};
