const express = require('express');
const { upload } = require("../utils/multerConfig");
const { getNotifications, deleteNotification, createBlogAndSendAlert,createBlogAndNotifyUser,getReportCount, } = require("../controllers/NotificationController");
const router = express.Router();
// Fetch all notifications for a specific user
router.get('/:userId', getNotifications);

// Delete a notification by ID
router.delete('/delete', deleteNotification);
// Create a blog post and send a notification
router.post("/create-diagnosis-blog", createBlogAndNotifyUser);
router.get("/count", getReportCount);
// Create a blog post and send alerts
router.post("/create-and-send-alert", upload.single("image"), createBlogAndSendAlert);
module.exports = router;
