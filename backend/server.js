
const express = require('express');
const cors = require('cors');
const path = require('path');
const fetch = require('node-fetch');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const multer = require('multer');
const { exec } = require('child_process');
const redis = require('redis');
const Queue = require('bull');
const DiagnosisRoutes = require('./routes/DiagnosisRoutes');
const bodyParser = require("body-parser");
const analysisRoutes = require("./routes/analysisRoutes");
const HistoryRoutes = require("./routes/HistoryRoutes");
const postRoutes = require("./routes/postRoutes");
const notificationRoutes = require("./routes/NotificationRoutes");
const SolveRoutes = require('./routes/SolveRoutes');
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;
app.use(express.urlencoded({ extended: true }));
// Middleware
app.use(cors({
  origin: '*', 
  credentials: true,  // Allow credentials (cookies, authorization headers, etc.)
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],  // Include any additional headers your frontend might send
}));
app.use(bodyParser.json());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'uploads')));

// Redis and Bull Queue
const redisClient = redis.createClient({ host: '127.0.0.1', port: 6379 });
redisClient.on('connect', () => console.log('Connected to Redis'));
redisClient.on('error', err => console.error('Redis error:', err));
const emailQueue = new Queue('emailQueue', { redis: { host: '127.0.0.1', port: 6379 } });
emailQueue.process(async (job) => {
    const { to, subject, text } = job.data;
    const transporter = require('./utils/nodemailerConfig').transporter;
    await transporter.sendMail({ from: process.env.EMAIL_USER, to, subject, text });
});

mongoose
  .connect(process.env.MONGODB_URI, { useNewUrlParser: true, useUnifiedTopology: true })
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.log("MongoDB Connection Error:", err));


// fetching states
app.get('/states/', async (req, res) => {
  const response = await fetch("https://cdn-api.co-vin.in/api/v2/admin/location/states");
  const data = await response.json();
  res.json(data);
});

app.get('/districts/:stateId', async (req, res) => {
  const stateId = req.params.stateId;
  const response = await fetch(`https://cdn-api.co-vin.in/api/v2/admin/location/districts/${stateId}`);
  const data = await response.json();
  res.json(data);
});


// Routes

app.use("/api/users", require("./routes/userRoutes"));
app.use('/api/diagnosis', DiagnosisRoutes);
app.use("/api/analysis", require("./routes/analysisRoutes"));
app.use("/api/history", HistoryRoutes);
app.use("/posts", postRoutes);
app.use("/api/notifications", notificationRoutes);
app.use('/api/solve', SolveRoutes);

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

