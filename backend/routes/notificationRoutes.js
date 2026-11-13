const express = require('express');
const {
  getMyNotifications,
  getUnreadCount,
  markAsRead,
  markAllAsRead,
  deleteNotification,
} = require('../controllers/notificationController');
const { authenticate } = require('../middleware/authMiddleware');

const router = express.Router();

router.use(authenticate);

// ============ Specific routes BEFORE /:id ============
router.get('/me', getMyNotifications);
router.get('/me/unread-count', getUnreadCount);
router.put('/me/read-all', markAllAsRead);

// ============ Generic :id routes ============
router.put('/:id/read', markAsRead);         // ownership check inside controller
router.delete('/:id', deleteNotification);   // ownership check inside controller

module.exports = router;