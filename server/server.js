// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import rateLimit from 'express-rate-limit'; 

// Import Route Handlers
import trackRoutes from './routes/track.js';
import skillsRoutes from './routes/skills.js';
import roadmapRoutes from './routes/roadmap.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();
dotenv.config({ override: true });
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Global Middleware
// Updated CORS to allow both local development and Vercel production
app.use(cors({
  origin: [
    'http://localhost:5173', 
    'https://job-pulse-pi.vercel.app'
  ],
  credentials: true
}));
app.use(express.json());

// CRITICAL for Render: Tells Express to look at the actual user's IP, 
// not Render's Load Balancer IP. Required for the rate limiter to work accurately.
app.set('trust proxy', 1); 

// Launch Improvement: Rate Limiting
// Increased to 5000 to account for 1000 students sharing the same Campus Wi-Fi IP
const apiLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minute window
  max: 5000, 
  message: { error: "Too many requests, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply rate limiter to all API routes
app.use('/api/', apiLimiter);

// Mount Routes (Leaderboard Removed)
app.use('/api/track', trackRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/analytics', analyticsRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});