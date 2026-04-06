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
    // 1. Fetch skills with real-world job listings and demand scores
    const { data: skills, error: skillsErr } = await supabase.from('skills').select('id, name, current_job_listings, demand_score');
    if (skillsErr) throw skillsErr;

    // 2. Fetch student tracked skills
    const { data: tracked, error: trackedErr } = await supabase.from('tracked_skills').select('skill_id, user_id');
    if (trackedErr) throw trackedErr;

    // 3. Get total active students
    const { count: userCount } = await supabase.from('profiles').select('*', { count: 'exact', head: true });

    // 4. Aggregate tracked skills
    const distribution = {};
    if (tracked) {
      tracked.forEach(t => {
        if (!distribution[t.skill_id]) distribution[t.skill_id] = 0;
        distribution[t.skill_id] += 1; // Count 1 per student tracking it
      });
    }

    // 5. Format data for charts
    const maxJobs = Math.max(...skills.map(s => s.current_job_listings || 1));
    const maxTracks = Math.max(...Object.values(distribution).length ? Object.values(distribution) : [1]);

    let totalStudentVol = 0;
    let totalMarketVol = 0;

    const chartData = skills.map(skill => {
      const studentVolume = distribution[skill.id] || 0;
      const marketVolume = skill.current_job_listings || 0;
      
      totalStudentVol += studentVolume;
      totalMarketVol += marketVolume;

      const normalizedStudent = (studentVolume / maxTracks) * 100;
      const normalizedMarket = (marketVolume / maxJobs) * 100;

      return {
        name: skill.name,
        value: studentVolume, // Number of students tracking
        marketJobs: marketVolume,
        studentScore: Math.round(normalizedStudent) || 0,
        marketScore: Math.round(normalizedMarket) || 0
      };
    }).filter(item => item.value > 0 || item.marketJobs > 0)
      .sort((a, b) => b.value - a.value);

    // 6. CALCULATE PLACEMENT READINESS SCORE
    let totalVariance = 0;
    if (totalStudentVol > 0 && totalMarketVol > 0) {
      chartData.forEach(item => {
        const studentPct = (item.value / totalStudentVol) * 100;
        const marketPct = (item.marketJobs / totalMarketVol) * 100;
        totalVariance += Math.abs(studentPct - marketPct);
      });
    }
    const readinessScore = totalStudentVol === 0 ? 0 : Math.round(100 - (totalVariance / 2));

    // 7. Generate Actionable Insights
    const topStudentSkill = chartData[0]?.name || 'N/A';
    const topMarketSkill = [...chartData].sort((a, b) => b.marketJobs - a.marketJobs)[0]?.name || 'N/A';
    
    let insight = `Students are highly focused on ${topStudentSkill}. `;
    if (readinessScore < 70) {
      insight += `CRITICAL: The Placement Readiness Score is critically low (${readinessScore}/100). Students are prioritizing skills the market is not demanding. Urgent curriculum review required.`;
    } else if (topStudentSkill !== topMarketSkill) {
      insight += `However, the highest real-world demand is currently for ${topMarketSkill}. Consider organizing a seminar on ${topMarketSkill} to bridge this gap.`;
    } else {
      insight += `This aligns perfectly with current market demand! The department curriculum is highly effective.`;
    }

    res.json({
      chartData,
      totalUsers: userCount || 0,
      totalEngagements: tracked?.length || 0,
      readinessScore,
      insight,
      topMarketSkill,
      topAnalysts: [] // We cleared the financial leaderboard, so send an empty array for now
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/batch-trends', async (req, res) => {
  try {
    const targetYear = req.query.year || 2026;
    
    // Find all users in the target graduation year
    const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id').eq('graduation_year', targetYear);
    if (profileErr) throw profileErr;
    
    const userIds = profiles.map(p => p.id);
    if (userIds.length === 0) return res.json([]);

    // Fetch tracked skills for those seniors
    const { data: tracked, error: trackedErr } = await supabase
      .from('tracked_skills')
      .select('skill_id, skills(name, demand_score)')
      .in('user_id', userIds);
    if (trackedErr) throw trackedErr;

    // Aggregate
    const skillCounts = {};
    if (tracked) {
      tracked.forEach(t => {
        if (!skillCounts[t.skill_id]) {
          skillCounts[t.skill_id] = { id: t.skill_id, name: t.skills.name, score: t.skills.demand_score, volumeHeld: 0 };
        }
        skillCounts[t.skill_id].volumeHeld += 1;
      });
    }

    const topSkills = Object.values(skillCounts).sort((a, b) => b.volumeHeld - a.volumeHeld).slice(0, 3);
    res.json(topSkills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;