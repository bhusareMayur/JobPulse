// server/server.js
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import Route Handlers
import tradeRoutes from './routes/trade.js';
import leaderboardRoutes from './routes/leaderboard.js';
import skillsRoutes from './routes/skills.js';
import './workers/demandScraper.js';
import analyticsRoutes from './routes/analytics.js';

dotenv.config();

const app = express();

// Global Middleware
app.use(cors());
app.use(express.json());

// Mount Routes
app.use('/api/trade', tradeRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/skills', skillsRoutes);
app.use('/api/analytics', analyticsRoutes);

// Start Server
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});