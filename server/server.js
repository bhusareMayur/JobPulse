// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Import Route Handlers
import trackRoutes from './routes/track.js';
import leaderboardRoutes from './routes/leaderboard.js';
import skillsRoutes from './routes/skills.js';
import roadmapRoutes from './routes/roadmap.js';
import './workers/demandScraper.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();
dotenv.config({ override: true });
const app = express();
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, '.env') });

// Global Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/track', trackRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/roadmap', roadmapRoutes);
app.use('/api/analytics', analyticsRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});