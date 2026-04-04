import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_ANON_KEY
);

// Middleware: Verifies the JWT from the frontend
const authenticateUser = async (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: 'No token provided' });

  const { data: { user }, error } = await supabase.auth.getUser(token);
  if (error || !user) return res.status(401).json({ error: 'Invalid token' });

  req.user = user;
  next();
};

// Route: Execute Buy/Sell Trade
app.post('/api/trade', authenticateUser, async (req, res) => {
  const { skillId, type, quantity } = req.body;
  const userId = req.user.id;

  try {
    // 1. Get current skill price and user profile
    const { data: skill } = await supabase.from('skills').select('*').eq('id', skillId).single();
    const { data: profile } = await supabase.from('profiles').select('balance').eq('id', userId).single();

    const totalValue = Number(skill.current_price) * quantity;
    let newBalance = Number(profile.balance);
    let newPrice = Number(skill.current_price);

    if (type === 'buy') {
      if (newBalance < totalValue) throw new Error('Insufficient JobCoins');
      newBalance -= totalValue;
      newPrice += (quantity * 0.01); // Price increases on buy
    } else {
      // Logic for sell (check holdings, decrease price)
      const { data: holding } = await supabase.from('holdings')
        .select('quantity').eq('user_id', userId).eq('skill_id', skillId).single();
      if (!holding || holding.quantity < quantity) throw new Error('Insufficient units');
      newBalance += totalValue;
      newPrice -= (quantity * 0.01); // Price decreases on sell
    }

    // 2. Perform Database Updates
    await supabase.from('profiles').update({ balance: newBalance }).eq('id', userId);
    await supabase.from('skills').update({ current_price: Math.max(0.1, newPrice) }).eq('id', skillId);
    await supabase.from('trades').insert({ 
      user_id: userId, skill_id: skillId, type, quantity, price: skill.current_price, total_value: totalValue 
    });

    res.json({ success: true, balance: newBalance });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));