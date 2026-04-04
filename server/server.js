import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createClient } from '@supabase/supabase-js';

dotenv.config();
const app = express();
app.use(cors());
app.use(express.json());

// Initialize Supabase (Use SERVICE_ROLE_KEY if you run into RLS update issues on 'skills' table)
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY
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
    // 1. Get current skill price, user profile, and current holdings
    const { data: skill, error: skillError } = await supabase.from('skills').select('*').eq('id', skillId).single();
    if (skillError) throw new Error('Skill not found');

    // FIX: Select referred_by and referral_rewarded to check for referral eligibility
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('balance, referred_by, referral_rewarded')
      .eq('id', userId)
      .single();
    if (profileError) throw new Error('Profile not found');

    const { data: holding } = await supabase.from('holdings')
      .select('*')
      .eq('user_id', userId)
      .eq('skill_id', skillId)
      .single();

    const tradePrice = Number(skill.current_price);
    const totalValue = tradePrice * quantity;
    let newBalance = Number(profile.balance);
    let newPrice = tradePrice;

    if (type === 'buy') {
      if (newBalance < totalValue) throw new Error('Insufficient JobCoins');
      newBalance -= totalValue;
      newPrice += (quantity * 0.01); // Price increases on buy

      // Calculate new holding averages
      const currentQty = holding ? holding.quantity : 0;
      const currentAvgPrice = holding ? holding.average_buy_price : 0;
      const newQty = currentQty + quantity;
      const newAvgPrice = ((currentQty * currentAvgPrice) + totalValue) / newQty;

      // Update Holdings Wallet
      await supabase.from('holdings').upsert({
        user_id: userId,
        skill_id: skillId,
        quantity: newQty,
        average_buy_price: newAvgPrice,
        updated_at: new Date().toISOString()
      });

      // Update Buy Volume
      await supabase.from('skills').update({ 
        total_buy_volume: skill.total_buy_volume + quantity 
      }).eq('id', skillId);

    } else if (type === 'sell') {
      if (!holding || holding.quantity < quantity) throw new Error('Insufficient units to sell');
      newBalance += totalValue;
      newPrice -= (quantity * 0.01); // Price decreases on sell

      const newQty = holding.quantity - quantity;
      
      if (newQty === 0) {
        // Remove from wallet if everything is sold
        await supabase.from('holdings').delete()
          .eq('user_id', userId)
          .eq('skill_id', skillId);
      } else {
        // Update wallet with reduced quantity
        await supabase.from('holdings').update({
          quantity: newQty,
          updated_at: new Date().toISOString()
        }).eq('user_id', userId).eq('skill_id', skillId);
      }

      // Update Sell Volume
      await supabase.from('skills').update({ 
        total_sell_volume: skill.total_sell_volume + quantity 
      }).eq('id', skillId);
      
    } else {
      throw new Error('Invalid trade type');
    }

    // --- FIX: REFERRAL REWARD LOGIC ---
    let referralProcessed = false;
    
    if (profile.referred_by && !profile.referral_rewarded) {
      // Find the user who referred this person
      const { data: referrer } = await supabase
        .from('profiles')
        .select('id, balance')
        .eq('referral_code', profile.referred_by)
        .single();

      if (referrer) {
        // Give 500 JC to the new user making their first trade
        newBalance += 500;
        
        // Give 1000 JC to the person who referred them
        await supabase
          .from('profiles')
          .update({ balance: Number(referrer.balance) + 1000 })
          .eq('id', referrer.id);

        // Keep a record of the reward
        await supabase.from('referral_rewards').insert({
          referrer_id: referrer.id,
          referee_id: userId,
          referrer_amount: 1000,
          referee_amount: 500
        });

        referralProcessed = true;
      }
    }
    // ----------------------------------

    // 2. Perform Global Database Updates
    const finalPrice = Math.max(0.1, newPrice); // Price cannot drop below 0.1 JC

    // Update Profile Balance
    const profileUpdatePayload = { balance: newBalance };
    if (referralProcessed) {
      profileUpdatePayload.referral_rewarded = true;
    }
    await supabase.from('profiles').update(profileUpdatePayload).eq('id', userId);
    
    // Update Skill Market Price
    await supabase.from('skills').update({ current_price: finalPrice }).eq('id', skillId);
    
    // Insert into Trade History
    await supabase.from('trades').insert({ 
      user_id: userId, 
      skill_id: skillId, 
      type, 
      quantity, 
      price: tradePrice, 
      total_value: totalValue 
    });

    // ---> FIX FOR THE GRAPH: Insert into Price History <---
    await supabase.from('price_history').insert({
      skill_id: skillId,
      price: finalPrice
    });

    res.json({ success: true, balance: newBalance, referralBonusApplied: referralProcessed });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Route: Get Leaderboard
app.get('/api/leaderboard', async (req, res) => {
  try {
    // 1. Fetch all profiles and their current JobCoin balances
    const { data: profiles, error: profileErr } = await supabase.from('profiles').select('*');
    if (profileErr) throw profileErr;

    // 2. Fetch all user holdings and join with the skills table to get the current price
    const { data: holdings, error: holdErr } = await supabase
      .from('holdings')
      .select('user_id, quantity, skills(current_price)');
    if (holdErr) throw holdErr;

    // 3. Fetch user emails from Supabase Auth (Requires Service Role Key)
    const { data: authData, error: authErr } = await supabase.auth.admin.listUsers();
    const users = authData?.users || [];

    const leaderboardMap = new Map();

    // Map profiles and match them with their emails
    profiles.forEach(profile => {
      const authUser = users.find(u => u.id === profile.id);
      
      // Mask email for privacy (e.g., test@example.com -> te***@example.com)
      let displayEmail = 'Anonymous Trader';
      if (authUser?.email) {
        const [name, domain] = authUser.email.split('@');
        displayEmail = `${name.slice(0, 2)}***@${domain}`;
      }

      leaderboardMap.set(profile.id, {
        userId: profile.id,
        email: displayEmail,
        balance: Number(profile.balance),
        portfolioValue: 0,
      });
    });

    // Add up the current value of all skills in their portfolio
    holdings.forEach(holding => {
      const user = leaderboardMap.get(holding.user_id);
      if (user && holding.skills) {
        user.portfolioValue += holding.quantity * Number(holding.skills.current_price);
      }
    });

    // Calculate total wealth, profit, and percentage
    const leaderboard = Array.from(leaderboardMap.values()).map(user => {
      const totalWealth = user.balance + user.portfolioValue;
      const profit = totalWealth - 10000; // 10000 JC is the starting balance
      const profitPercentage = ((profit / 10000) * 100).toFixed(2);

      return {
        ...user,
        totalWealth,
        profit,
        profitPercentage
      };
    });

    // Sort traders by Total Wealth (highest first)
    leaderboard.sort((a, b) => b.totalWealth - a.totalWealth);

    res.json({ leaderboard });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});


// Route: Add a New Skill
app.post('/api/skills', authenticateUser, async (req, res) => {
  const { name, initialPrice } = req.body;

  try {
    // 1. Basic Validation
    if (!name || name.trim() === '') {
      return res.status(400).json({ error: 'Skill name is required' });
    }
    
    const minPrice = 1.0; // Define your absolute minimum price floor here
    const price = Number(initialPrice);
    if (isNaN(price) || price < minPrice) {
      return res.status(400).json({ error: `Initial price must be at least ${minPrice} JC` });
    }

    const cleanName = name.trim();

    // 2. Check for Duplicates (Case-Insensitive)
    // using ilike allows us to catch "React" if "react" already exists
    const { data: existingSkill } = await supabase
      .from('skills')
      .select('id')
      .ilike('name', cleanName)
      .maybeSingle();

    if (existingSkill) {
      return res.status(400).json({ error: 'This skill already exists in the market' });
    }

    // 3. Insert the new skill
    const { data: newSkill, error: insertError } = await supabase
      .from('skills')
      .insert({
        name: cleanName,
        current_price: price,
        initial_price: price,
        total_buy_volume: 0,
        total_sell_volume: 0
      })
      .select()
      .single();

    if (insertError) throw insertError;

    // 4. Initialize Price History (Crucial for the SkillDetail graph)
    await supabase.from('price_history').insert({
      skill_id: newSkill.id,
      price: price
    });

    res.json({ success: true, skill: newSkill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));