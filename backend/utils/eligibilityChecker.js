// ==========================================
// Eligibility Checker
// Determines if a student meets a job's criteria
// ==========================================

/**
 * Check if a student is eligible for a job.
 * 
 * Rules:
 *  1. Student's CGPA >= job's min_cgpa
 *  2. Student's active backlogs <= job's max_backlogs
 *  3. Student's department is in the job's eligible_depts
 *  4. Student's graduation year matches (if specified)
 *  5. Job deadline has not passed
 *  6. Job status is 'Open'
 *  7. Student hasn't already applied (optional — separate check)
 * 
 * Returns: { eligible: true/false, reasons: [...] }
 */
function checkEligibility(student, job) {
  const reasons = [];

  // 1. CGPA check
  if (parseFloat(student.cgpa) < parseFloat(job.min_cgpa)) {
    reasons.push(
      `CGPA ${student.cgpa} is below required ${job.min_cgpa}`
    );
  }

  // 2. Backlogs check
  if (student.active_backlogs > job.max_backlogs) {
    reasons.push(
      `Active backlogs (${student.active_backlogs}) exceed maximum (${job.max_backlogs})`
    );
  }

  // 3. Department check — eligible_depts is stored as "CSE,IT,ECE"
  if (job.eligible_depts) {
    const eligibleList = job.eligible_depts
      .split(',')
      .map((d) => d.trim().toUpperCase());
    const studentDept = (student.dept_code || '').toUpperCase();
    if (!eligibleList.includes(studentDept)) {
      reasons.push(
        `Department ${studentDept} not eligible (allowed: ${job.eligible_depts})`
      );
    }
  }

  // 4. Graduation year check
  if (
    job.eligible_grad_year &&
    parseInt(student.graduation_year) !== parseInt(job.eligible_grad_year)
  ) {
    reasons.push(
      `Graduation year ${student.graduation_year} doesn't match required ${job.eligible_grad_year}`
    );
  }

  // 5. Deadline check
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const deadline = new Date(job.deadline);
  deadline.setHours(0, 0, 0, 0);
  if (deadline < today) {
    reasons.push(`Application deadline (${job.deadline}) has passed`);
  }

  // 6. Job status check
  if (job.status !== 'Open') {
    reasons.push(`Job status is ${job.status}, not Open`);
  }

  return {
    eligible: reasons.length === 0,
    reasons,
  };
}

module.exports = { checkEligibility };