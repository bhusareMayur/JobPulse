// server/routes/analytics.js
import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/hod', async (req, res) => {
  const { pass } = req.query;
  
  if (pass !== process.env.HOD_PASSWORD) {
    return res.status(401).json({ error: 'Incorrect Admin Password' });
  }

  try {
    // 1. Fetch skills with real-world job listings
    const { data: skills, error: skillsErr } = await supabase.from('skills').select('id, name, current_job_listings');
    if (skillsErr) throw skillsErr;

    // 2. Fetch student holdings
    const { data: holdings, error: holdingsErr } = await supabase.from('holdings').select('skill_id, quantity');
    if (holdingsErr) throw holdingsErr;

    // 3. Fetch total trade activity
    const { count: totalTrades } = await supabase.from('trades').select('*', { count: 'exact', head: true });

    // 4. Get total active students
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    // 5. Aggregate holdings
    const distribution = {};
    if (holdings) {
      holdings.forEach(h => {
        if (!distribution[h.skill_id]) distribution[h.skill_id] = 0;
        distribution[h.skill_id] += h.quantity;
      });
    }

    // 6. Format data for charts
    const maxJobs = Math.max(...skills.map(s => s.current_job_listings || 1));
    const maxHoldings = Math.max(...Object.values(distribution).length ? Object.values(distribution) : [1]);

    let totalStudentVol = 0;
    let totalMarketVol = 0;

    const chartData = skills.map(skill => {
      const studentVolume = distribution[skill.id] || 0;
      const marketVolume = skill.current_job_listings || 0;
      
      totalStudentVol += studentVolume;
      totalMarketVol += marketVolume;

      const normalizedStudent = (studentVolume / maxHoldings) * 100;
      const normalizedMarket = (marketVolume / maxJobs) * 100;

      return {
        name: skill.name,
        value: studentVolume,
        marketJobs: marketVolume,
        studentScore: Math.round(normalizedStudent) || 0,
        marketScore: Math.round(normalizedMarket) || 0
      };
    }).filter(item => item.value > 0 || item.marketJobs > 0)
      .sort((a, b) => b.value - a.value);

    // 7. CALCULATE PLACEMENT READINESS SCORE
    let totalVariance = 0;
    if (totalStudentVol > 0 && totalMarketVol > 0) {
      chartData.forEach(item => {
        const studentPct = (item.value / totalStudentVol) * 100;
        const marketPct = (item.marketJobs / totalMarketVol) * 100;
        totalVariance += Math.abs(studentPct - marketPct);
      });
    }
    const readinessScore = totalStudentVol === 0 ? 0 : Math.round(100 - (totalVariance / 2));

    // 8. Generate Actionable Insights
    const topStudentSkill = chartData[0]?.name || 'N/A';
    const topMarketSkill = [...chartData].sort((a, b) => b.marketJobs - a.marketJobs)[0]?.name || 'N/A';
    
    let insight = `Students are highly focused on ${topStudentSkill}. `;
    if (readinessScore < 70) {
      insight += `CRITICAL: The Placement Readiness Score is critically low (${readinessScore}/100). Students are heavily investing in skills the market is not prioritizing. Urgent intervention required.`;
    } else if (topStudentSkill !== topMarketSkill) {
      insight += `However, the highest real-world demand is currently for ${topMarketSkill}. Consider organizing a seminar on ${topMarketSkill} to bridge this gap.`;
    } else {
      insight += `This perfectly aligns with current market demand! The department curriculum is highly effective.`;
    }

    // 9. OPTIMAL: FETCH TOP MARKET ANALYSTS (Top 5 Students)
    const { data: topUsersView, error: topUsersErr } = await supabase
      .from('leaderboard_view')
      .select('user_id, total_wealth, profit')
      .order('total_wealth', { ascending: false })
      .limit(5); // Only fetch exactly 5 rows (instantly fast)

    let topAnalysts = [];
    if (!topUsersErr && topUsersView?.length > 0) {
      const topUserIds = topUsersView.map(u => u.user_id);

      // Fetch Profiles (for names) using exactly those 5 IDs
      const { data: profilesData } = await supabase.from('profiles').select('id, full_name').in('id', topUserIds);

      // Fetch Holdings for just these 5 users to find their #1 skill
      const { data: topHoldings } = await supabase.from('holdings').select('user_id, skill_id, quantity').in('user_id', topUserIds);

      // Fetch exactly 5 emails in parallel (Bypasses the 2,000 user list limit bottleneck)
      const authPromises = topUserIds.map(id => supabase.auth.admin.getUserById(id));
      const authResults = await Promise.all(authPromises);
      const authMap = {};
      authResults.forEach(res => {
        if (res.data?.user) authMap[res.data.user.id] = res.data.user;
      });

      // Build the final array
      topAnalysts = topUsersView.map((user, index) => {
        const profile = profilesData?.find(p => p.id === user.user_id);
        const authUser = authMap[user.user_id];
        
        // Find their max holding quantity
        const userHoldings = topHoldings?.filter(h => h.user_id === user.user_id) || [];
        let topSkillId = null;
        let maxQuantity = 0;
        userHoldings.forEach(h => {
          if (h.quantity > maxQuantity) {
            maxQuantity = h.quantity;
            topSkillId = h.skill_id;
          }
        });

        // Reuse the memory array from Step 1 to find the name (Zero DB Cost)
        const topSkill = skills.find(s => s.id === topSkillId);

        return {
          rank: index + 1,
          id: user.user_id,
          name: profile?.full_name || authUser?.user_metadata?.full_name || 'Unknown Student',
          email: authUser?.email || 'No Email Registered',
          wealth: Number(user.total_wealth),
          topSkill: topSkill ? topSkill.name : 'Holding Cash' // If no skills held, they are holding cash
        };
      });
    }

    res.json({
      chartData,
      totalUsers: userCount || 0,
      totalTrades: totalTrades || 0,
      readinessScore,
      insight,
      topMarketSkill,
      topAnalysts // Sending the new watchlist to the frontend
    });
  } catch (error) {
    console.error("Analytics Error:", error);
    res.status(500).json({ error: error.message });
  }
});


router.get('/batch-trends', async (req, res) => {
  try {
    const targetYear = req.query.year || 2026; // Default to the current placement batch
    
    // 1. Find all users in the target graduation year
    const { data: profiles, error: profileErr } = await supabase
      .from('profiles')
      .select('id')
      .eq('graduation_year', targetYear);

    if (profileErr) throw profileErr;
    
    const userIds = profiles.map(p => p.id);
    if (userIds.length === 0) return res.json([]);

    // 2. Fetch all holdings for JUST those seniors
    const { data: holdings, error: holdingsErr } = await supabase
      .from('holdings')
      .select('skill_id, quantity, skills(name, current_price)')
      .in('user_id', userIds);

    if (holdingsErr) throw holdingsErr;

    // 3. Aggregate the data to find the most popular skills
    const skillCounts = {};
    if (holdings) {
      holdings.forEach(h => {
        if (!skillCounts[h.skill_id]) {
          skillCounts[h.skill_id] = { 
            id: h.skill_id, 
            name: h.skills.name, 
            price: h.skills.current_price,
            volumeHeld: 0 
          };
        }
        skillCounts[h.skill_id].volumeHeld += h.quantity;
      });
    }

    // 4. Sort and return the Top 3
    const topSkills = Object.values(skillCounts)
      .sort((a, b) => b.volumeHeld - a.volumeHeld)
      .slice(0, 3);

    res.json(topSkills);
  } catch (error) {
    console.error("Batch Trends Error:", error);
    res.status(500).json({ error: error.message });
  }
});

export default router;