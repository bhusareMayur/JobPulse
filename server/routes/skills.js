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

export default router;