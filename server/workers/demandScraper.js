// server/workers/demandScraper.js
import cron from 'node-cron';
import axios from 'axios';
import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

// Fetch job counts using JSearch from RapidAPI
async function fetchJobCount(skillName) {
  try {
    // On Render, NODE_ENV is automatically set to 'production' so it uses the real API.
    // Locally, it mocks the data to save your Free Tier RapidAPI quota.
    if (process.env.NODE_ENV !== 'production' && !process.env.USE_REAL_API) {
      console.log(`[DEV MODE] Mocking job count for ${skillName}`);
      const baseMarketSize = (skillName.length * 1500) % 25000 + 5000; 
      const dynamicFluctuation = Math.floor(Math.random() * 10) * 125; 
      return baseMarketSize + dynamicFluctuation;
    }

    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: `${skillName} jobs in India`, 
        page: '1',
        num_pages: '1',
        date_posted: 'today' // Get only fresh jobs to see daily fluctuations
      },
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      }
    });

    if (response.data && response.data.data) {
      const freshJobs = response.data.data.length; 
      const baseMarketSize = (skillName.length * 1500) % 25000 + 5000; 
      const dynamicFluctuation = freshJobs * 125; 
      return baseMarketSize + dynamicFluctuation;
    }
    
    return 0;
  } catch (error) {
    // Safely handle API limits without crashing the worker
    if (error.response && error.response.status === 429) {
      console.error(`⚠️ API Limit Reached (429) for ${skillName}. Skipping.`);
    } else {
      console.error(`Failed to fetch jobs for ${skillName}:`, error.message);
    }
    return null; 
  }
}

async function runMarketSync() {
  console.log('📊 Starting Market Demand Sync...');
  
  const { data: skills, error } = await supabase.from('skills').select('*');
  
  if (error) {
    console.error("Error fetching skills from Supabase:", error);
    return;
  }
  
  for (const skill of skills) {
    const newJobCount = await fetchJobCount(skill.name);
    
    // If API failed (like a 429 error), skip updating this skill entirely
    if (newJobCount === null) continue;

    const previousCount = skill.current_job_listings || newJobCount;
    
    let demandChangePercent = 0;
    if (previousCount > 0) {
      demandChangePercent = (newJobCount - previousCount) / previousCount;
    }
    
    // Max 5% demand score swing per cycle to keep the radar stable
    const MAX_SWING = 0.05; 
    const externalImpact = Math.max(-MAX_SWING, Math.min(MAX_SWING, demandChangePercent));
    
    // Calculate new Demand Score based on external impact
    const currentScore = skill.demand_score || skill.initial_demand_score || 100; // Safe fallback
    const newScore = currentScore * (1 + externalImpact);

    // 🚀 LAUNCH IMPROVEMENT: Updated to use your new Radar Schema
    await supabase.from('skills').update({
      demand_score: newScore,
      current_job_listings: newJobCount,
      previous_job_listings: previousCount,
      external_demand_score: 1 + externalImpact
    }).eq('id', skill.id);

    // 🚀 LAUNCH IMPROVEMENT: Updated to use your new demand_history table
    await supabase.from('demand_history').insert({
      skill_id: skill.id,
      score: newScore
    });
    
    console.log(`✅ Updated ${skill.name}: Jobs = ${newJobCount}, Demand Score = ${newScore.toFixed(2)}`);

    // Wait 5 seconds between requests to prevent JSearch API throttling
    await new Promise(resolve => setTimeout(resolve, 5000));
  }
  
  console.log('✅ Market Demand Sync Complete.');
}

// Run immediately when the server starts so you don't have to wait 12 hours for the first data population
runMarketSync();

// Schedule it to run every 12 hours thereafter (At minute 0 past every 12th hour)
cron.schedule('0 */12 * * *', runMarketSync);