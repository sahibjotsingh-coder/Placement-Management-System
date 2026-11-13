const { getPool, sql } = require('../config/db');

// ============================================
// 1. DASHBOARD — Top-level KPIs
// ============================================
async function getDashboardStats() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      -- Students
      (SELECT COUNT(*) FROM students) AS total_students,
      (SELECT COUNT(*) FROM students WHERE is_placed = 1) AS placed_students,
      (SELECT COUNT(*) FROM students WHERE is_placed = 0) AS unplaced_students,
      
      -- Companies
      (SELECT COUNT(*) FROM companies) AS total_companies,
      (SELECT COUNT(*) FROM companies WHERE is_verified = 1) AS verified_companies,
      
      -- Jobs
      (SELECT COUNT(*) FROM job_postings) AS total_jobs,
      (SELECT COUNT(*) FROM job_postings WHERE status = 'Open') AS open_jobs,
      
      -- Applications
      (SELECT COUNT(*) FROM applications) AS total_applications,
      (SELECT COUNT(*) FROM applications WHERE current_status = 'Selected') AS selected_applications,
      (SELECT COUNT(*) FROM applications WHERE current_status = 'Rejected') AS rejected_applications,
      
      -- Placements
      (SELECT COUNT(*) FROM placement_records) AS total_offers,
      (SELECT COUNT(*) FROM placement_records WHERE is_accepted = 1) AS accepted_offers,
      
      -- Packages
      (SELECT ISNULL(AVG(package_lpa), 0) FROM placement_records WHERE is_accepted = 1) AS avg_package,
      (SELECT ISNULL(MAX(package_lpa), 0) FROM placement_records WHERE is_accepted = 1) AS highest_package,
      (SELECT ISNULL(MIN(package_lpa), 0) FROM placement_records WHERE is_accepted = 1) AS lowest_package
  `);

  const row = result.recordset[0];
  const placementRate = row.total_students > 0
    ? ((row.placed_students / row.total_students) * 100).toFixed(2)
    : 0;

  return { ...row, placement_rate: parseFloat(placementRate) };
}

// ============================================
// 2. PLACEMENT SUMMARY — Company-wise
// ============================================
async function getPlacementSummary() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      c.company_id,
      c.company_name,
      c.industry,
      COUNT(pr.record_id) AS total_offers,
      SUM(CASE WHEN pr.is_accepted = 1 THEN 1 ELSE 0 END) AS accepted_offers,
      ISNULL(AVG(pr.package_lpa), 0) AS avg_package,
      ISNULL(MAX(pr.package_lpa), 0) AS highest_package
    FROM companies c
    LEFT JOIN placement_records pr ON c.company_id = pr.company_id
    GROUP BY c.company_id, c.company_name, c.industry
    ORDER BY total_offers DESC, c.company_name
  `);
  return result.recordset;
}

// ============================================
// 3. DEPARTMENT SUMMARY
// ============================================
async function getDepartmentSummary() {
  const pool = await getPool();
  const result = await pool.request().query(`
    SELECT
      d.dept_id,
      d.dept_code,
      d.dept_name,
      COUNT(DISTINCT s.student_id) AS total_students,
      COUNT(DISTINCT CASE WHEN s.is_placed = 1 THEN s.student_id END) AS placed_students,
      COUNT(DISTINCT a.application_id) AS total_applications,
      ISNULL(AVG(CASE WHEN s.is_placed = 1 THEN s.cgpa END), 0) AS avg_cgpa_placed,
      ISNULL((
        SELECT AVG(pr.package_lpa)
        FROM placement_records pr
        JOIN students st ON pr.student_id = st.student_id
        WHERE st.dept_id = d.dept_id AND pr.is_accepted = 1
      ), 0) AS avg_package
    FROM departments d
    LEFT JOIN students s ON d.dept_id = s.dept_id
    LEFT JOIN applications a ON s.student_id = a.student_id
    GROUP BY d.dept_id, d.dept_code, d.dept_name
    ORDER BY placed_students DESC
  `);

  return result.recordset.map((row) => ({
    ...row,
    placement_rate:
      row.total_students > 0
        ? parseFloat(((row.placed_students / row.total_students) * 100).toFixed(2))
        : 0,
  }));
}

// ============================================
// 4. PACKAGE STATS
// ============================================
async function getPackageStats() {
  const pool = await getPool();

  // Overall
  const overall = await pool.request().query(`
    SELECT
      COUNT(*) AS total_offers,
      ISNULL(AVG(package_lpa), 0) AS avg_package,
      ISNULL(MAX(package_lpa), 0) AS highest_package,
      ISNULL(MIN(package_lpa), 0) AS lowest_package,
      ISNULL(SUM(CASE WHEN package_lpa >= 10 THEN 1 ELSE 0 END), 0) AS offers_above_10lpa,
      ISNULL(SUM(CASE WHEN package_lpa >= 20 THEN 1 ELSE 0 END), 0) AS offers_above_20lpa
    FROM placement_records
    WHERE is_accepted = 1
  `);

  // Distribution buckets
  const buckets = await pool.request().query(`
    SELECT
      CASE
        WHEN package_lpa < 5  THEN '< 5 LPA'
        WHEN package_lpa < 10 THEN '5-10 LPA'
        WHEN package_lpa < 15 THEN '10-15 LPA'
        WHEN package_lpa < 20 THEN '15-20 LPA'
        ELSE '20+ LPA'
      END AS bucket,
      COUNT(*) AS count
    FROM placement_records
    WHERE is_accepted = 1
    GROUP BY CASE
        WHEN package_lpa < 5  THEN '< 5 LPA'
        WHEN package_lpa < 10 THEN '5-10 LPA'
        WHEN package_lpa < 15 THEN '10-15 LPA'
        WHEN package_lpa < 20 THEN '15-20 LPA'
        ELSE '20+ LPA'
      END
  `);

  return {
    overall: overall.recordset[0],
    distribution: buckets.recordset,
  };
}

// ============================================
// 5. TOP RECRUITERS
// ============================================
async function getTopRecruiters(limit = 5) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('limit', sql.Int, limit)
    .query(`
      SELECT TOP (@limit)
        c.company_id,
        c.company_name,
        c.industry,
        COUNT(pr.record_id) AS total_offers,
        ISNULL(AVG(pr.package_lpa), 0) AS avg_package,
        ISNULL(MAX(pr.package_lpa), 0) AS highest_package
      FROM companies c
      JOIN placement_records pr ON c.company_id = pr.company_id
      GROUP BY c.company_id, c.company_name, c.industry
      ORDER BY total_offers DESC
    `);
  return result.recordset;
}

// ============================================
// 6. ELIGIBILITY GAP ANALYSIS
// Per job: how many students are eligible vs applied vs selected
// ============================================
async function getEligibilityGap() {
  const pool = await getPool();

  const result = await pool.request().query(`
    SELECT
      j.job_id,
      j.job_title,
      j.min_cgpa,
      j.max_backlogs,
      j.eligible_depts,
      c.company_name,
      (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.job_id) AS applied_count,
      (SELECT COUNT(*) FROM applications a 
         WHERE a.job_id = j.job_id AND a.current_status = 'Selected') AS selected_count
    FROM job_postings j
    JOIN companies c ON j.company_id = c.company_id
    WHERE j.status = 'Open'
    ORDER BY applied_count DESC
  `);

  return result.recordset;
}

// ============================================
// 7. UPCOMING DEADLINES
// ============================================
async function getUpcomingDeadlines(days = 14) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('days', sql.Int, days)
    .query(`
      SELECT
        j.job_id,
        j.job_title,
        j.deadline,
        j.package_lpa,
        c.company_name,
        DATEDIFF(DAY, CAST(GETDATE() AS DATE), j.deadline) AS days_remaining,
        (SELECT COUNT(*) FROM applications a WHERE a.job_id = j.job_id) AS application_count
      FROM job_postings j
      JOIN companies c ON j.company_id = c.company_id
      WHERE j.status = 'Open'
        AND j.deadline >= CAST(GETDATE() AS DATE)
        AND j.deadline <= DATEADD(DAY, @days, CAST(GETDATE() AS DATE))
      ORDER BY j.deadline ASC
    `);
  return result.recordset;
}

// ============================================
// 8. STUDENT STATUS
// ============================================
async function getStudentStatus({ deptId, isPlaced } = {}) {
  const pool = await getPool();
  const request = pool.request();

  const where = [];
  if (deptId) {
    where.push('s.dept_id = @deptId');
    request.input('deptId', sql.Int, deptId);
  }
  if (isPlaced !== undefined) {
    where.push('s.is_placed = @isPlaced');
    request.input('isPlaced', sql.Bit, isPlaced ? 1 : 0);
  }
  const whereClause = where.length ? 'WHERE ' + where.join(' AND ') : '';

  const result = await request.query(`
    SELECT
      s.student_id,
      s.roll_number,
      s.full_name,
      s.cgpa,
      s.active_backlogs,
      s.graduation_year,
      s.is_placed,
      d.dept_code,
      u.email,
      (SELECT COUNT(*) FROM applications a WHERE a.student_id = s.student_id) AS total_applications,
      (SELECT COUNT(*) FROM applications a 
         WHERE a.student_id = s.student_id AND a.current_status = 'Selected') AS selected_count,
      (SELECT COUNT(*) FROM placement_records pr 
         WHERE pr.student_id = s.student_id AND pr.is_accepted = 1) AS accepted_offers
    FROM students s
    JOIN departments d ON s.dept_id = d.dept_id
    JOIN users u ON s.user_id = u.user_id
    ${whereClause}
    ORDER BY s.is_placed DESC, s.cgpa DESC
  `);
  return result.recordset;
}

module.exports = {
  getDashboardStats,
  getPlacementSummary,
  getDepartmentSummary,
  getPackageStats,
  getTopRecruiters,
  getEligibilityGap,
  getUpcomingDeadlines,
  getStudentStatus,
};