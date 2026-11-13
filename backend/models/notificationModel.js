const { getPool, sql } = require('../config/db');

// ============================================
// GET NOTIFICATIONS FOR A USER (with pagination)
// ============================================
async function getNotificationsByUser(userId, { limit = 20, offset = 0, unreadOnly = false } = {}) {
  const pool = await getPool();
  const request = pool.request();
  request.input('userId', sql.Int, userId);
  request.input('limit', sql.Int, limit);
  request.input('offset', sql.Int, offset);

  let whereExtra = '';
  if (unreadOnly) {
    whereExtra = 'AND is_read = 0';
  }

  const result = await request.query(`
    SELECT 
      notification_id,
      user_id,
      title,
      message,
      is_read,
      created_at
    FROM notifications
    WHERE user_id = @userId ${whereExtra}
    ORDER BY created_at DESC
    OFFSET @offset ROWS
    FETCH NEXT @limit ROWS ONLY
  `);

  return result.recordset;
}

// ============================================
// UNREAD COUNT
// ============================================
async function getUnreadCount(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      SELECT COUNT(*) AS unread_count
      FROM notifications
      WHERE user_id = @userId AND is_read = 0
    `);
  return result.recordset[0].unread_count;
}

// ============================================
// GET ONE NOTIFICATION (with ownership check)
// ============================================
async function getNotificationById(notificationId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('notificationId', sql.Int, notificationId)
    .query(`
      SELECT notification_id, user_id, title, message, is_read, created_at
      FROM notifications
      WHERE notification_id = @notificationId
    `);
  return result.recordset[0] || null;
}

// ============================================
// MARK ONE AS READ
// ============================================
async function markAsRead(notificationId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('notificationId', sql.Int, notificationId)
    .query(`
      UPDATE notifications
      SET is_read = 1
      WHERE notification_id = @notificationId;
      SELECT notification_id, user_id, title, message, is_read, created_at
      FROM notifications
      WHERE notification_id = @notificationId;
    `);
  return result.recordset[0] || null;
}

// ============================================
// MARK ALL AS READ
// ============================================
async function markAllAsRead(userId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, userId)
    .query(`
      UPDATE notifications
      SET is_read = 1
      WHERE user_id = @userId AND is_read = 0
    `);
  return result.rowsAffected[0];
}

// ============================================
// DELETE ONE
// ============================================
async function deleteNotification(notificationId) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('notificationId', sql.Int, notificationId)
    .query(`
      DELETE FROM notifications WHERE notification_id = @notificationId
    `);
  return result.rowsAffected[0];
}

// ============================================
// CREATE NOTIFICATION (helper — used by other controllers)
// ============================================
async function createNotification({ user_id, title, message }) {
  const pool = await getPool();
  const result = await pool
    .request()
    .input('userId', sql.Int, user_id)
    .input('title', sql.NVarChar, title)
    .input('message', sql.NVarChar, message)
    .query(`
      INSERT INTO notifications (user_id, title, message)
      VALUES (@userId, @title, @message);
      SELECT SCOPE_IDENTITY() AS notification_id;
    `);
  return result.recordset[0].notification_id;
}

module.exports = {
  getNotificationsByUser,
  getUnreadCount,
  getNotificationById,
  markAsRead,
  markAllAsRead,
  deleteNotification,
  createNotification,
};