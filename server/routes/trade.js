// server/routes/trade.js
import express from 'express';
import { z } from 'zod';
import { supabase } from '../config/supabase.js';
import { authenticateUser } from '../middleware/auth.js';

const router = express.Router();

// Define the exact shape and rules for a trade request
const tradeSchema = z.object({
  skillId: z.string().uuid({ message: "Invalid skill ID format. Must be a valid UUID." }),
  type: z.enum(['buy', 'sell'], { errorMap: () => ({ message: "Trade type must be exactly 'buy' or 'sell'." }) }),
  quantity: z.number().int().positive({ message: "Quantity must be a positive whole number." })
});

router.post('/', authenticateUser, async (req, res) => {
  try {
    // 1. Strictly validate the incoming request body using Zod
    const validationResult = tradeSchema.safeParse(req.body);
    
    // If validation fails, return a 400 Bad Request with the specific error message
    if (!validationResult.success) {
      return res.status(400).json({ 
        error: validationResult.error.errors[0].message 
      });
    }

    // 2. Extract the safely validated data
    const { skillId, type, quantity } = validationResult.data;
    const userId = req.user.id;

    // 3. Call the Supabase RPC to handle the transaction atomically
    const { data, error } = await supabase.rpc('execute_trade', {
      p_user_id: userId,
      p_skill_id: skillId,
      p_type: type,
      p_quantity: quantity
    });

    if (error) throw new Error(error.message);

    res.json(data);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;