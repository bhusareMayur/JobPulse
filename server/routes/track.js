// server/routes/track.js
import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    // --- 1. ACADEMIC MODE (MARKET HOURS CHECK) ---
    const now = new Date();
    const utc = now.getTime() + (now.getTimezoneOffset() * 60000);
    const istTime = new Date(utc + (3600000 * 5.5)); // UTC + 5:30
    const currentHourIST = istTime.getHours();

    // Pause tracking updates during college hours (e.g., 9 AM to 4 PM)
    // Adjust these hours as needed for your specific academic mode
    if (currentHourIST >= 21 || currentHourIST < 9) {
      return res.status(403).json({
        error: 'Academic Mode Active: The simulation is paused during college hours to ensure focus on lectures.'
      });
    }

    // 2. Validate User Auth
    const authHeader = req.headers.authorization;
    if (!authHeader) return res.status(401).json({ error: 'Missing authorization header' });
    
    const token = authHeader.replace('Bearer ', '');
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) return res.status(401).json({ error: 'Unauthorized to track skills' });

    const { skillId, action, status = 'learning' } = req.body; // action: 'track' or 'untrack'

    if (!skillId || !action) {
      return res.status(400).json({ error: 'Invalid parameters' });
    }

    // 3. Upsert or Delete Tracking Record
    if (action === 'track') {
      const { error: trackError } = await supabase
        .from('tracked_skills')
        .upsert({ 
          user_id: user.id, 
          skill_id: skillId, 
          status,
          updated_at: new Date().toISOString()
        }, { onConflict: 'user_id, skill_id' });

      if (trackError) throw trackError;
    } else if (action === 'untrack') {
      const { error: untrackError } = await supabase
        .from('tracked_skills')
        .delete()
        .eq('user_id', user.id)
        .eq('skill_id', skillId);

      if (untrackError) throw untrackError;
    }

    res.json({ success: true, message: `Successfully ${action}ed skill.` });
  } catch (error) {
    console.error('Track Error:', error.message);
    res.status(400).json({ error: error.message });
  }
});

export default router;