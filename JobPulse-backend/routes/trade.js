import express from 'express';
import { supabaseAdmin, authenticateUser } from '../server.js';

const router = express.Router();

router.post('/execute-trade', authenticateUser, async (req, res) => {
  const { skillId, type, quantity } = req.body;
  const userId = req.user.id;

  try {
    // 1. Fetch current data
    const { data: skill } = await supabaseAdmin.from('skills').select('*').eq('id', skillId).single();
    const { data: profile } = await supabaseAdmin.from('profiles').select('balance').eq('id', userId).single();

    const totalCost = Number(skill.current_price) * quantity;

    if (type === 'buy') {
      if (profile.balance < totalCost) throw new Error('Insufficient JobCoins');

      // Update balance & price logic (+0.01 per unit)
      const newPrice = Number(skill.current_price) + (quantity * 0.01);
      
      await supabaseAdmin.from('profiles').update({ balance: profile.balance - totalCost }).eq('id', userId);
      await supabaseAdmin.from('skills').update({ current_price: newPrice }).eq('id', skillId);
    } 
    // Add 'sell' logic here following similar patterns...

    // 2. Record trade and update holdings
    await supabaseAdmin.from('trades').insert({
      user_id: userId,
      skill_id: skillId,
      type,
      quantity,
      price: skill.current_price,
      total_value: totalCost
    });

    res.json({ success: true, message: 'Trade successful' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;