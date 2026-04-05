// server/routes/leaderboard.js
import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { year } = req.query;

    // 1. Fetch profiles first so we can filter by graduation year
    let profileQuery = supabase.from('profiles').select('id, full_name, graduation_year');
    
    // If a specific year is requested (e.g., "2026"), filter the profiles
    if (year && year !== 'all') {
      profileQuery = profileQuery.eq('graduation_year', parseInt(year));
    }
    
    const { data: profiles, error: profileErr } = await profileQuery;
    if (profileErr) throw profileErr;

    // Create an array of valid user IDs for the requested batch
    const validUserIds = profiles.map(p => p.id);

    // 2. Fetch the Leaderboard View
    const { data: lbData, error: lbErr } = await supabase
      .from('leaderboard_view')
      .select('*')
      .order('total_wealth', { ascending: false });

    if (lbErr) throw lbErr;

    // 3. Match the data and filter out users not in the selected batch
    const leaderboard = lbData
      .filter(entry => validUserIds.includes(entry.user_id))
      .map(entry => {
        const profile = profiles.find(p => p.id === entry.user_id);
        return {
          userId: entry.user_id,
          name: profile?.full_name || 'Unknown Analyst',
          batch: profile?.graduation_year || 2026,
          balance: Number(entry.balance) || 0,
          portfolioValue: Number(entry.portfolio_value) || 0,
          totalWealth: Number(entry.total_wealth) || 0,
          profit: Number(entry.profit) || 0,
          profitPercentage: entry.profit_percentage || '0.00'
        };
      });

    res.json({ leaderboard });
  } catch (error) {
    console.error("Leaderboard Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;