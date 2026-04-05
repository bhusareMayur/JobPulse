// server/routes/roadmap.js
import express from 'express';
import dotenv from 'dotenv';
import { authenticateUser } from '../middleware/auth.js'; 

const router = express.Router();
dotenv.config();
dotenv.config({ override: true });


router.post('/generate', authenticateUser, async (req, res) => {
  try {
    const { targetRole, currentSkills, duration } = req.body;

    if (!targetRole || !duration) {
      return res.status(400).json({ error: 'Target role and duration are required.' });
    }

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return res.status(500).json({ error: 'Server missing GEMINI_API_KEY' });
    }

    const prompt = `
      You are an expert Senior Software Engineer and Career Coach. 
      Create a highly actionable, ${duration}-day learning roadmap for someone aiming to become a ${targetRole}.
      Their current skills are: ${currentSkills ? currentSkills : 'None (Beginner)'}.
      If they have current skills, the FIRST phase of the roadmap MUST be a "Skill Calibration & Fast-Track" phase that acknowledges those skills and skips the basics.

      You MUST respond ONLY with a valid JSON array. Do not include markdown blocks like \`\`\`json.
      
      Each object in the array must follow this exact structure:
      {
        "day": "Day X-Y",
        "title": "String",
        "desc": "Short 2 sentence description",
        "iconName": "One of: Server, Database, ShieldCheck, Zap, Cloud, Layout, Layers, BarChart, CheckCircle2, Terminal, Brain, Sparkles, Rocket",
        "color": "Tailwind text color class (e.g., text-blue-500, text-green-500, text-purple-500, text-amber-500, text-rose-500)",
        "bg": "Tailwind bg color class matching the text color (e.g., bg-blue-100, bg-green-100, bg-purple-100, bg-amber-100, bg-rose-100)",
        "tasks": ["Actionable task 1", "Actionable task 2", "Actionable task 3"]
      }
      Generate exactly 5 phases (milestones) covering the full ${duration} days.
    `;

    // 1. Bypass the SDK and call the Google REST API directly
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

    const apiResponse = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents: [{
          parts: [{ text: prompt }]
        }],
        generationConfig: {
          temperature: 0.7, // Add some slight creativity for better roadmap advice
        }
      })
    });

    const data = await apiResponse.json();

    // 2. If Google throws an error, log the exact details so we can see it
    if (!apiResponse.ok) {
      console.error("❌ Google API Direct Error:", JSON.stringify(data, null, 2));
      return res.status(apiResponse.status).json({ 
        error: data.error?.message || 'Failed to reach Google API' 
      });
    }

    // 3. Extract and parse the JSON safely
    const responseText = data.candidates[0].content.parts[0].text;
    const cleanJson = responseText.replace(/```json/g, '').replace(/```/g, '').trim();
    
    const roadmapData = JSON.parse(cleanJson);

    res.json({ success: true, roadmap: roadmapData });
  } catch (error) {
    console.error('🔥 Server Crash in roadmap.js:', error);
    res.status(500).json({ error: 'Failed to generate roadmap due to server error.' });
  }
});

export default router;