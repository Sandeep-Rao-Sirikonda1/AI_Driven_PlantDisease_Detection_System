const mongoose = require('mongoose');

const NotificationSchema = new mongoose.Schema({
  user_id: { type: Number, required: true },
  notifications: [
    {
      id: { type: String, required: true },
      note: { type: String, required: true },
      title: { type: String, required: true },
      desc: { type: String, required: true },
      createdAt: { type: Date, required: true },
      read: { type: Boolean, default: false },
      blogUrl: { type: String, default: null } // New field to store the blog URL
    },
  ],
});

module.exports = mongoose.model('Notification', NotificationSchema);
