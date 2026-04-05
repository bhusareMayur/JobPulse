import cron from 'node-cron';
import axios from 'axios';
import dotenv from 'dotenv';
import { supabase } from '../config/supabase.js';

dotenv.config();

// Fetch job counts using JSearch from RapidAPI
async function fetchJobCount(skillName) {
  try {
    const response = await axios.get('https://jsearch.p.rapidapi.com/search', {
      params: {
        query: `${skillName} jobs in India`, 
        page: '1',
        num_pages: '1',
        date_posted: 'today' // Get only fresh jobs to see daily fluctuations!
      },
      headers: {
        'x-rapidapi-host': 'jsearch.p.rapidapi.com',
        'x-rapidapi-key': process.env.RAPIDAPI_KEY
      }
    });

    if (response.data && response.data.data) {
      const freshJobs = response.data.data.length; // Will be between 0 and 10
      
      // PORTFOLIO HACK: Generate a realistic "Total Market Size" based on the fresh jobs.
      // We use the length of the skill name as a deterministic seed so it remains stable.
      const baseMarketSize = (skillName.length * 1500) % 25000 + 5000; 
      
      // Add a dynamic fluctuation based on how many "fresh" jobs were posted today
      // If JSearch finds 10 fresh jobs today, the market looks hot. If it finds 2, it cools down.
      const dynamicFluctuation = freshJobs * 125; 
      
      // Total realistic job count
      const realisticTotalCount = baseMarketSize + dynamicFluctuation;
      
      return realisticTotalCount;
    }
    
    return 0;
  } catch (error) {
    console.error(`Failed to fetch jobs for ${skillName}:`, error.message);
    return null;
  }
}

// 1. Extract the main logic into a reusable function
async function runMarketSync() {
  console.log('Starting market demand sync with JSearch...');
  
  const { data: skills, error } = await supabase.from('skills').select('*');
  
  if (error) {
    console.error("Error fetching skills from Supabase:", error);
    return;
  }
  
  for (const skill of skills) {
    const newJobCount = await fetchJobCount(skill.name);
    
    if (newJobCount === null) continue;

    // Use current job listings if they exist, otherwise establish baseline
    const previousCount = skill.current_job_listings || newJobCount;
    
    let demandChangePercent = 0;
    if (previousCount > 0) {
      demandChangePercent = (newJobCount - previousCount) / previousCount;
    }
    
    // Max 5% price swing per cycle
    const MAX_SWING = 0.05; 
    const externalImpact = Math.max(-MAX_SWING, Math.min(MAX_SWING, demandChangePercent));
    
    const newPrice = skill.current_price * (1 + externalImpact);

    // Update the database
    await supabase.from('skills').update({
      current_price: newPrice,
      current_job_listings: newJobCount,
      previous_job_listings: previousCount,
      external_demand_score: 1 + externalImpact
    }).eq('id', skill.id);

    // Log the price change
    await supabase.from('price_history').insert({
      skill_id: skill.id,
      price: newPrice
    });
    
    console.log(`✅ Updated ${skill.name}: Jobs = ${newJobCount}, Impact = ${(externalImpact * 100).toFixed(2)}%`);

    // Wait 2 seconds to avoid RapidAPI rate limits
    await new Promise(resolve => setTimeout(resolve, 2000));
  }
  
  console.log('Market demand sync complete.');
}

// 2. Run immediately when the server starts
runMarketSync();

// 3. Schedule it to run every 12 hours thereafter
cron.schedule('0 */12 * * *', runMarketSync);