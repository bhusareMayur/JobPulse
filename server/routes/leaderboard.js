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

    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
    const users = authData?.users || [];

    const leaderboard = leaderboardData.map(user => {
      const authUser = users.find(u => u.id === user.user_id);
      
      let displayEmail = 'Anonymous Trader';
      if (authUser?.email) {
        const [name, domain] = authUser.email.split('@');
        displayEmail = `${name.slice(0, 2)}***@${domain}`;
      }

      return {
        userId: user.user_id,
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