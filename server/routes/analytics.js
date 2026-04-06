// server/routes/analytics.js
import express from 'express';
import { supabase } from '../config/supabase.js';

const router = express.Router();

router.get('/hod', async (req, res) => {
  const { pass, role = 'hod', department = 'CS' } = req.query;
  
  // 1. Role-Based Authentication
  if (role === 'tpo') {
    if (pass !== process.env.TPO_PASSWORD) {
      return res.status(401).json({ error: 'Incorrect TPO Password' });
    }
  } else {
    // Dynamically check department password (e.g., CS_HOD_PASSWORD)
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

    // ==========================================
    // 5. Cross-Department Comparison (Available to EVERYONE)
    // ==========================================
    const deptCounts = {};
    allTracked?.forEach(t => {
      const dept = userMap[t.user_id]?.dept || 'Unassigned';
      deptCounts[dept] = (deptCounts[dept] || 0) + 1;
    });
    
    const departmentComparison = Object.keys(deptCounts).map(dept => ({
      name: dept,
      engagements: deptCounts[dept]
    }));

    // ==========================================
    // 6. Filter Data for specific HOD scope
    // ==========================================
    let relevantProfiles = allProfiles;
    let relevantTracked = allTracked;

    if (role === 'hod') {
      // Isolate to just this department
      relevantProfiles = allProfiles.filter(p => p.department === department);
      const validUserIds = new Set(relevantProfiles.map(p => p.id));
      relevantTracked = allTracked.filter(t => validUserIds.has(t.user_id));
    }

    const totalActiveStudents = relevantProfiles.length;

    // ==========================================
    // 7. Aggregate HOD-specific metrics
    // ==========================================
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
      insight = `Waiting for student engagement. Students in your department have not started tracking skills yet.`;
    } else if (readinessScore < 70) {
      insight += `CRITICAL: The Placement Readiness Score is critically low (${readinessScore}/100). Students are prioritizing skills the market is not demanding. Urgent curriculum review required.`;
    } else if (topStudentSkill !== topMarketSkill) {
      insight += `However, the highest real-world demand is currently for ${topMarketSkill}. Consider organizing a seminar on ${topMarketSkill} to bridge this gap.`;
    } else {
      insight += `This aligns perfectly with current market demand! The curriculum is highly effective.`;
    }

    // ==========================================
    // 10. GENERATE TOP TALENT WATCHLIST 
    // ==========================================
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

    // Map into array, calculate score points, and rank
    const topAnalysts = Object.keys(userStats)
      .map(userId => ({
        id: userId,
        name: userMap[userId]?.name || 'Active Student',
        email: 'student@institute.edu', // Protected identity fallback
        topSkill: userStats[userId].topSkillName,
        wealth: Math.round(userStats[userId].totalScore * 10), // Acts as "Skill Points"
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

// Leave /batch-trends route exactly as it is...

export default router;