// server/routes/leaderboard.js
import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const { data: leaderboardData, error: viewErr } = await supabase
      .from('leaderboard_view')
      .select('*')
      .order('total_wealth', { ascending: false })
      .limit(100);

    if (viewErr) throw viewErr;

    // Fetch emails from auth system (for the masked email display)
    const { data: authData } = await supabase.auth.admin.listUsers();
    const users = authData?.users || [];

    // Fetch full_name directly from the profiles table
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('id, full_name');
    const profiles = profilesData || [];

    const leaderboard = leaderboardData.map(user => {
      const authUser = users.find(u => u.id === user.user_id);
      const dbProfile = profiles.find(p => p.id === user.user_id);
      
      let displayEmail = 'Anonymous Trader';
      
      // Look at the profiles table first for the name
      let displayName = dbProfile?.full_name || 'Unknown Trader';

      if (authUser) {
        // Fallback to auth metadata if it's somehow missing in profiles
        if (displayName === 'Unknown Trader' && authUser.user_metadata?.full_name) {
          displayName = authUser.user_metadata.full_name;
        }

        if (authUser.email) {
          const [name, domain] = authUser.email.split('@');
          displayEmail = `${name.slice(0, 2)}***@${domain}`;
        }
      }

      return {
        userId: user.user_id,
        name: displayName, // Now accurately pulls from the database
        email: displayEmail,
        balance: Number(user.balance),
        portfolioValue: Number(user.portfolio_value),
        totalWealth: Number(user.total_wealth),
        profit: Number(user.profit),
        profitPercentage: user.profit_percentage
      };
    });

    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;