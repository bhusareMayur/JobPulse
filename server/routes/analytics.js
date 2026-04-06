// server/routes/analytics.js
import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/hod', async (req, res) => {
  // CRITICAL FIX: Prevent all CDN, Edge, and Browser Caching
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');

  const { pass, role = 'hod', department = 'CS' } = req.query;
  
  // 1. Role-Based Authentication
  if (role === 'tpo') {
    if (pass !== process.env.TPO_PASSWORD) {
      return res.status(401).json({ error: 'Incorrect TPO Password' });
    }
  } else {
    const expectedPass = process.env[`${department.toUpperCase()}_HOD_PASSWORD`];
    if (!expectedPass || pass !== expectedPass) {
      return res.status(401).json({ error: `Incorrect Password for ${department} HOD` });
    }
  }

  try {
    // 2. Fetch ALL Profiles globally (Needed for cross-department comparison)
    const { data: allProfiles, error: profileErr } = await supabase.from('profiles').select('id, full_name, department');
    if (profileErr) throw profileErr;

    // 3. Fetch ALL Tracked Skills globally
    const { data: allTracked, error: trackedErr } = await supabase.from('tracked_skills').select('skill_id, user_id');
    if (trackedErr) throw trackedErr;

    // 4. Fetch Market Skills
    const { data: skills, error: skillsErr } = await supabase.from('skills').select('id, name, current_job_listings, demand_score');
    if (skillsErr) throw skillsErr;

    // Map skill IDs for quick lookup
    const skillMap = {};
    skills.forEach(s => skillMap[s.id] = s);

    // Map users to their respective departments
    const userMap = {};
    allProfiles.forEach(p => {
      userMap[p.id] = { dept: p.department || 'Unassigned', name: p.full_name || 'Anonymous Student' };
    });

    // 5. Cross-Department Comparison (Available to EVERYONE)
    const deptCounts = {};
    allTracked?.forEach(t => {
      const dept = userMap[t.user_id]?.dept || 'Unassigned';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    
    const departmentComparison = Object.keys(deptCounts).map(dept => ({
      name: dept,
      engagements: deptCounts[dept]
    }));

    // 6. Filter Data for specific HOD scope
    let relevantProfiles = allProfiles;
    let relevantTracked = allTracked;

    if (role === 'hod') {
      relevantProfiles = allProfiles.filter(p => p.department === department);
      const validUserIds = new Set(relevantProfiles.map(p => p.id));
      relevantTracked = allTracked.filter(t => validUserIds.has(t.user_id));
    }

    const totalActiveStudents = relevantProfiles.length;

    // 7. Aggregate HOD-specific metrics
    const distribution = {};
    relevantTracked?.forEach(t => {
      if (!distribution[t.skill_id]) distribution[t.skill_id] = 0;
      distribution[t.skill_id] += 1;
    });

    const maxJobs = Math.max(...skills.map(s => s.current_job_listings || 1));
    const maxTracks = Math.max(...Object.values(distribution).length ? Object.values(distribution) : [1]);

    let totalStudentVol = 0;
    let totalMarketVol = 0;

    const chartData = skills.map(skill => {
      const studentVolume = distribution[skill.id] || 0;
      const marketVolume = skill.current_job_listings || 0;
      
      totalStudentVol += studentVolume;
      totalMarketVol += marketVolume;

      return {
        name: skill.name,
        value: studentVolume, 
        marketJobs: marketVolume,
        studentScore: Math.round((studentVolume / maxTracks) * 100) || 0,
        marketScore: Math.round((marketVolume / maxJobs) * 100) || 0
      };
    }).filter(item => item.value > 0 || item.marketJobs > 0)
      .sort((a, b) => b.value - a.value);

    // 8. Calculate Readiness Score
    let totalVariance = 0;
    if (totalStudentVol > 0 && totalMarketVol > 0) {
      chartData.forEach(item => {
        const studentPct = (item.value / totalStudentVol) * 100;
        const marketPct = (item.marketJobs / totalMarketVol) * 100;
        totalVariance += Math.abs(studentPct - marketPct);
      });
    }
    const readinessScore = totalStudentVol === 0 ? 0 : Math.round(100 - (totalVariance / 2));

    // 9. Generate AI Insights
    const topStudentSkill = chartData.sort((a, b) => b.value - a.value)[0]?.name || 'N/A';
    const topMarketSkill = [...chartData].sort((a, b) => b.marketJobs - a.marketJobs)[0]?.name || 'N/A';
    
    let insight = `Students are highly focused on ${topStudentSkill}. `;
    if (readinessScore === 0) {
      insight = `Waiting for student engagement. Students in your scope have not started tracking skills yet.`;
    } else if (readinessScore < 70) {
      insight += `CRITICAL: The Placement Readiness Score is critically low (${readinessScore}/100). Students are prioritizing skills the market is not demanding. Urgent curriculum review required.`;
    } else if (topStudentSkill !== topMarketSkill) {
      insight += `However, the highest real-world demand is currently for ${topMarketSkill}. Consider organizing a seminar on ${topMarketSkill} to bridge this gap.`;
    } else {
      insight += `This aligns perfectly with current market demand! The curriculum is highly effective.`;
    }

    // 10. GENERATE TOP TALENT WATCHLIST 
    const userStats = {};
    relevantTracked?.forEach(t => {
      if (!userStats[t.user_id]) {
        userStats[t.user_id] = { totalScore: 0, topSkillScore: 0, topSkillName: 'N/A' };
      }
      
      const skillScore = skillMap[t.skill_id]?.demand_score || 0;
      userStats[t.user_id].totalScore += skillScore;
      
      if (skillScore > userStats[t.user_id].topSkillScore) {
        userStats[t.user_id].topSkillScore = skillScore;
        userStats[t.user_id].topSkillName = skillMap[t.skill_id]?.name || 'N/A';
      }
    });

    const topAnalysts = Object.keys(userStats)
      .map(userId => ({
        id: userId,
        name: userMap[userId]?.name || 'Active Student',
        email: 'student@institute.edu', 
        topSkill: userStats[userId].topSkillName,
        wealth: Math.round(userStats[userId].totalScore * 10), 
      }))
      .sort((a, b) => b.wealth - a.wealth)
      .slice(0, 5)
      .map((analyst, index) => ({ ...analyst, rank: index + 1 }));

    res.json({
      chartData,
      totalUsers: totalActiveStudents,
      totalEngagements: relevantTracked?.length || 0,
      readinessScore,
      insight,
      topMarketSkill,
      topAnalysts, 
      departmentComparison
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

router.get('/batch-trends', async (req, res) => {
  try {
    const targetYear = req.query.year || 2026;
    const { data: profiles, error: profileErr } = await supabase.from('profiles').select('id').eq('graduation_year', targetYear);
    if (profileErr) throw profileErr;
    
    const userIds = profiles.map(p => p.id);
    if (userIds.length === 0) return res.json([]);

    const { data: tracked, error: trackedErr } = await supabase
      .from('tracked_skills')
      .select('skill_id, skills(name, demand_score)')
      .in('user_id', userIds);
    if (trackedErr) throw trackedErr;

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