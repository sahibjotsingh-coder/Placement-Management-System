const notificationModel = require('../models/notificationModel');
const { success, error } = require('../utils/response');

// ============================================
// GET /api/notifications/me
// Query: ?limit=20&offset=0&unreadOnly=true
// ============================================
async function getMyNotifications(req, res) {
  try {
    const limit = req.query.limit ? parseInt(req.query.limit) : 20;
    const offset = req.query.offset ? parseInt(req.query.offset) : 0;
    const unreadOnly = req.query.unreadOnly === 'true';

    const notifications = await notificationModel.getNotificationsByUser(
      req.user.user_id,
      { limit, offset, unreadOnly }
    );

    return success(res, notifications, `Found ${notifications.length} notifications`);
  } catch (err) {
    console.error('getMyNotifications error:', err);
    return error(res, err.message, 500);
  }
}

// ============================================
// GET /api/notifications/me/unread-count
// ============================================
async function getUnreadCount(req, res) {
  try {
    const count = await notificationModel.getUnreadCount(req.user.user_id);
    return success(res, { unread_count: count }, 'Unread count fetched');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// PUT /api/notifications/:id/read
// ============================================
async function markAsRead(req, res) {
  try {
    const { id } = req.params;
    const notification = await notificationModel.getNotificationById(parseInt(id));
    if (!notification) return error(res, 'Notification not found', 404);

    if (notification.user_id !== req.user.user_id) {
      return error(res, 'You can only access your own notifications', 403);
    }

    const updated = await notificationModel.markAsRead(parseInt(id));
    return success(res, updated, 'Notification marked as read');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// PUT /api/notifications/me/read-all
// ============================================
async function markAllAsRead(req, res) {
  try {
    const count = await notificationModel.markAllAsRead(req.user.user_id);
    return success(res, { marked_count: count }, `${count} notifications marked as read`);
  } catch (err) {
    return error(res, err.message, 500);
  }
}

// ============================================
// DELETE /api/notifications/:id
// ============================================
async function deleteNotification(req, res) {
  try {
    const { id } = req.params;
    const notification = await notificationModel.getNotificationById(parseInt(id));
    if (!notification) return error(res, 'Notification not found', 404);

    if (notification.user_id !== req.user.user_id) {
      return error(res, 'You can only delete your own notifications', 403);
    }

    await notificationModel.deleteNotification(parseInt(id));
    return success(res, null, 'Notification deleted');
  } catch (err) {
    return error(res, err.message, 500);
  }
}

module.exports = {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
};