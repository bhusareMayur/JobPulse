// server/routes/skills.js
import express from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Define the exact shape and rules for creating a new skill
const skillSchema = z.object({
  name: z.string().trim().min(1, { message: "Skill name is required and cannot be empty." }),
  // Using coerce allows us to accept "1.5" (string from form) and safely convert it to a number 1.5
  initialPrice: z.coerce.number().min(1.0, { message: "Initial price must be at least 1.0 JC." })
});

router.post('/', authenticateUser, async (req, res) => {
  try {
    // 1. Strictly validate the incoming request body
    const validationResult = skillSchema.safeParse(req.body);
    
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: validationResult.error.errors[0].message 
      });
    }

    // 2. Extract the safely validated and formatted data
    const { name: cleanName, initialPrice: price } = validationResult.data;

    // 3. Check for Duplicates (Case-Insensitive)
    const { data: existingSkill } = await supabase
      .from('skills')
      .select('id')
      .ilike('name', cleanName)
      .maybeSingle();

    if (existingSkill) {
      return res.status(400).json({ error: 'This skill already exists in the market' });
    }

    // 4. Insert the new skill
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

    // 5. Initialize Price History
    await supabase.from('price_history').insert({
      skill_id: newSkill.id,
      price: price
    });

    res.json({ success: true, skill: newSkill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.get('/next-step', authenticateUser, async (req, res) => {
  try {
    // 1. Get all skills ordered by real-world demand
    const { data: allSkills, error: skillsErr } = await supabase
      .from('skills')
      .select('id, name, demand_score, current_job_listings')
      .order('demand_score', { ascending: false });

    if (skillsErr) throw skillsErr;

    // 2. Get the user's currently tracked skills
    const { data: trackedSkills, error: trackErr } = await supabase
      .from('tracked_skills')
      .select('skill_id')
      .eq('user_id', req.user.id);

    if (trackErr) throw trackErr;

    const trackedIds = new Set(trackedSkills.map(t => t.skill_id));

    // 3. Find the highest demand skill they ARE NOT tracking
    const recommendedSkill = allSkills.find(skill => !trackedIds.has(skill.id));

    if (!recommendedSkill) {
      return res.json({ message: "You are tracking all available top skills!" });
    }

    res.json({ recommendedSkill });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});



router.get('/:id/predict', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;

    // 1. Fetch current skill data (Grab ALL columns to avoid missing column crashes)
    const { data: skill, error: skillError } = await supabase
      .from('skills')
      .select('*') 
      .eq('id', id)
      .single();

    if (skillError) throw skillError;

    // Safely support both your old schema (current_price) and new schema (demand_score)
    const currentScore = skill.demand_score || skill.current_price || 0;
    const currentJobs = skill.current_job_listings || 0;

    // 2. Fetch historical data (Safely check 'demand_history', fallback to 'price_history')
    let history = [];
    const { data: demandHistory, error: dhError } = await supabase
      .from('demand_history')
      .select('*')
      .eq('skill_id', id)
      .order('created_at', { ascending: true })
      .limit(30);

    if (!dhError && demandHistory && demandHistory.length > 0) {
      history = demandHistory;
    } else {
      // Fallback if demand_history doesn't exist yet
      const { data: priceHistory, error: phError } = await supabase
        .from('price_history')
        .select('*')
        .eq('skill_id', id)
        .order('created_at', { ascending: true })
        .limit(30);
      
      if (!phError && priceHistory) {
        history = priceHistory;
      }
    }

    // 3. Simple Linear Regression Algorithm to predict future scope
    let projectedPrice = currentScore;
    let trend = 'stable';
    let confidence = 'Low'; 

    if (history && history.length > 2) {
      confidence = history.length > 15 ? 'High' : 'Medium';
      
      const n = history.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0;

      history.forEach((point, index) => {
        // Safely extract the score regardless of the column name used in the DB
        const pointScore = point.score || point.price || point.demand_score || 0;
        sumX += index;
        sumY += Number(pointScore);
        sumXY += index * Number(pointScore);
        sumXX += index * index;
      });

      // Calculate slope (m)
      const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
      
      // Project 7 steps into the future
      const futureIndex = n + 7;
      
      // Calculate Y-intercept (b)
      const intercept = (sumY - slope * sumX) / n;
      
      projectedPrice = (slope * futureIndex) + intercept;

      // Determine textual trend
      if (slope > 0.05) trend = 'surging';
      else if (slope < -0.05) trend = 'declining';
      else trend = 'stable';
    }

    // 4. Incorporate today's job posting volume as a multiplier
    const jobVolumeMultiplier = currentJobs > 10000 ? 1.05 : 1.0;
    projectedPrice = Math.max(1, projectedPrice * jobVolumeMultiplier); 

    // Fail-safe: If math results in NaN (e.g. corrupted data), default to current score
    if (isNaN(projectedPrice)) projectedPrice = currentScore;

    // Send successful payload to frontend
    res.json({
      success: true,
      prediction: {
        projectedScore: projectedPrice.toFixed(2),
        trend: trend,
        confidence: confidence,
        currentJobs: currentJobs
      }
    });

  } catch (error) {
    console.error("Prediction API Error:", error);
    res.status(500).json({ error: error.message });
  }
});
export default router;