import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Routes
import authRoutes from './routes/auth.js'; // auth.js based on file list
import courseRoutes from './routes/courseRoutes.js';
import placementRoutes from './routes/placementRoutes.js';
import mentorshipRoutes from './routes/mentorshipRoutes.js';
import feedbackRoutes from './routes/feedbackRoutes.js';
import newsRoutes from './routes/newsRoutes.js';
import eventRoutes from './routes/eventRoutes.js';
import jobRoutes from './routes/jobRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import studentRoutes from './routes/studentRoutes.js';
import activityRoutes from './routes/activityRoutes.js';
import codingRoutes from './routes/codingRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import moduleRoutes from './routes/moduleRoutes.js';
import certificateRoutes from './routes/certificateRoutes.js';
import featureRoutes from './routes/featureRoutes.js';
import contactRoutes from './routes/contactRoutes.js'; // Assuming exist
import projectRoutes from './routes/projectRoutes.js';
import placementBlogRoutes from './routes/placementBlogRoutes.js';
import supportRoutes from './routes/supportRoutes.js';
import profileRoutes from './routes/profile.js';
import publicProfileRoutes from './routes/publicProfileRoutes.js';
import hodRoutes from './routes/hodRoutes.js';
import hodAssignmentRoutes from './routes/hodAssignmentRoutes.js';

dotenv.config();

import { createServer } from 'http';
import { Server } from 'socket.io';

// ... other imports

const PORT = process.env.PORT || 5000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));

const app = express();
const httpServer = createServer(app);

const allowedOrigins = [
  'http://localhost:8080',
  'http://localhost:5173',
  'https://2gbgpxv0-8080.inc1.devtunnels.ms',
  'https://workspace.prolync.in',
  'https://www.workspace.prolync.in'
];

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin) return callback(null, true);

    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("CORS blocked: " + origin));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE"],
};

app.use(cors(corsOptions));

// ✅ Socket.IO CORS Fix
const io = new Server(httpServer, {
  cors: {
    origin: allowedOrigins,
    methods: ["GET", "POST"],
    credentials: true,
  },
});
// Make io accessible globally
app.set('io', io);

io.on('connection', (socket) => {
  console.log('New client connected:', socket.id);
  socket.on('disconnect', () => console.log('Client disconnected'));
});
app.use(express.json());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Route Registration
app.use('/api/auth', authRoutes);
app.use('/api/admin/hod', hodRoutes); // Specific route FIRST
app.use('/api/courses', courseRoutes);
app.use('/api/placements', placementRoutes);
app.use('/api/mentorship', mentorshipRoutes);
app.use('/api/feedback', feedbackRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/events', eventRoutes);
app.use('/api/jobs', jobRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);
app.use('/api/activity', activityRoutes);
app.use('/api/coding', codingRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/modules', moduleRoutes);
app.use('/api/certificates', certificateRoutes);
app.use('/api/features', featureRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/placement-blogs', placementBlogRoutes);
app.use('/api/support', supportRoutes);
app.use('/api/profile', profileRoutes);
app.use('/api/public/profile', publicProfileRoutes);
app.use('/api/public/profile', publicProfileRoutes);

// ...

app.use('/api/contact', contactRoutes);
app.use('/api/hod-assignment', hodAssignmentRoutes);

// Base route
app.get('/', (req, res) => {
  res.send('API is running...');
});

// Test route for API connectivity
app.get('/api/test', (req, res) => {
  res.json({ message: 'API is working', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use(async (err, req, res, next) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const log = `[GLOBAL ERROR] ${new Date().toISOString()} - ${err.message}\n${err.stack}\n----------------\n`;
    fs.default.appendFileSync(path.default.join(process.cwd(), 'backend-error.log'), log);
  } catch (e) { console.error("Log failed", e); }

  console.error("Global Error:", err);

  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({ message: "File size is too large. Max limit is 10MB." });
  }

  res.status(500).json({ message: "Server Error: " + err.message });
});

// --- SCHEMA FIX (Auto-Run) ---
import db from './config/db.js';

const fixSchema = async () => {
  try {
    console.log("Running Auto-Schema Fix...");
    // user_progress table fixes
    try { await db.query("ALTER TABLE user_progress ADD COLUMN completion_percent INT DEFAULT 0"); } catch (e) { }
    try { await db.query("ALTER TABLE user_progress ADD COLUMN total_modules INT DEFAULT 0"); } catch (e) { }
    try { await db.query("ALTER TABLE user_progress ADD COLUMN completed_modules INT DEFAULT 0"); } catch (e) { }

    // enrollments table fixes
    try { await db.query("ALTER TABLE enrollments ADD COLUMN progress INT DEFAULT 0"); } catch (e) { }
    try { await db.query("ALTER TABLE enrollments ADD COLUMN completed BOOLEAN DEFAULT FALSE"); } catch (e) { }

    // User onboarding completion fix
    try { await db.query("ALTER TABLE users ADD COLUMN onboarding_completed BOOLEAN DEFAULT FALSE"); } catch (e) { }

    console.log("Schema Fix Done.");
  } catch (e) {
    console.error("Schema Fix Failed:", e);
  }
};

httpServer.listen(PORT, "0.0.0.0", async () => {
  await fixSchema();
  console.log(`Server running on port ${PORT}`);
});

