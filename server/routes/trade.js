// server/routes/trade.js
import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // --- 1. ACADEMIC MODE (MARKET HOURS CHECK) ---
    // Safely calculate the current hour in Indian Standard Time (IST)
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (3600000 * 5.5)); // UTC + 5:30
    const currentHourIST = istTime.getHours();

    // Block trades between 9:00 AM (hour 9) and 4:00 PM (hour 15.59)
    // Market opens precisely at 16:00 (4:00 PM)
    // if (currentHourIST >= 9 && currentHourIST < 16) {
    if (currentHourIST >= 21 || currentHourIST < 9) {
      return res.status(403).json({
        error: 'Academic Mode Active: The simulation is paused during college hours (9 AM - 4 PM) to ensure focus on lectures. Please return after 4 PM.'
      });
    }
    // ---------------------------------------------

    // 2. Validate User Auth
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'Missing authorization header' });
    }
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({ error: 'Unauthorized to simulate' });
    }

    const { skillId, type, quantity } = req.body;

    if (!skillId || !type || !quantity || quantity <= 0) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // 3. Execute the secure database transaction
    const { data, error: tradeError } = await supabase.rpc('execute_trade', {
      p_user_id: user.id,
      p_skill_id: skillId,
      p_type: type,
      p_quantity: quantity
    });

    if (tradeError) {
      throw tradeError;
    }

    res.json(data);
  } catch (error) {
    console.error('Trade Error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

export default router;