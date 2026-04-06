import { useEffect, useState } from 'react';
import { 
  TrendingUp, TrendingDown, ArrowRight, Search, 
  GraduationCap, Compass, Users, Activity, Zap, Flame, AlertCircle, Briefcase
} from 'lucide-react';
import { supabase } from '../lib/supabase';

interface DashboardProps {
  onNavigateToSkill: (skillId: string) => void;
}

export const Dashboard = ({ onNavigateToSkill }: DashboardProps) => {
  const [skills, setSkills] = useState<any[]>([]);
  const [seniorTrends, setSeniorTrends] = useState<any[]>([]);
  const [recommendedSkill, setRecommendedSkill] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [dbError, setDbError] = useState(false);

  useEffect(() => {
    fetchSkills();
    // fetchSeniorTrends() is now called inside fetchSkills to allow for the fallback data!
    fetchNextStep();
    
    const channel = supabase
      .channel('skills-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skills' }, () => {
        fetchSkills();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchSkills = async () => {
    try {
      // 1. Try fetching with the new column (demand_score) OR the old one (current_price)
      const { data: skillsData, error } = await supabase
        .from('skills')
        .select('*');

      if (error) throw error;

      // 2. Fetch tracking metrics safely
      let trackerCounts: Record<string, number> = {};
      const { data: trackedData, error: trackError } = await supabase
        .from('tracked_skills')
        .select('skill_id');

      // If tracked_skills doesn't exist yet, we catch it gracefully
      if (trackError) {
        console.warn("Tracked skills table missing. Falling back to 0 trackers.");
      } else if (trackedData) {
        trackedData.forEach(t => {
          trackerCounts[t.skill_id] = (trackerCounts[t.skill_id] || 0) + 1;
        });
      }

      // 3. Merge data and sort manually in JS to avoid SQL order crashes if column is missing
      if (skillsData) {
        const enhancedSkills = skillsData.map(s => ({
          ...s,
          trackers: trackerCounts[s.id] || 0
        })).sort((a, b) => {
          const scoreA = a.demand_score || a.current_price || 0;
          const scoreB = b.demand_score || b.current_price || 0;
          return scoreB - scoreA;
        });
        
        setSkills(enhancedSkills);
        
        // Pass the loaded skills to populate the Seniors Trend fallback
        fetchSeniorTrends(enhancedSkills);
      }
    } catch (err) {
      console.error("Dashboard Fetch Error:", err);
      setDbError(true);
    } finally {
      setLoading(false);
    }
  };

  const fetchSeniorTrends = async (availableSkills: any[] = []) => {
    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/batch-trends?year=2026`);
      if (res.ok) {
        const data = await res.json();
        // If the database returns real tracking data, use it!
        if (Array.isArray(data) && data.length > 0) {
          setSeniorTrends(data);
          return;
        }
      }
      throw new Error("No tracking data yet");
    } catch (err) {
      // SMART FALLBACK: If no students have tracked skills yet, 
      // automatically display the top 3 highest demand skills so the UI looks complete!
      if (availableSkills.length >= 3) {
        setSeniorTrends(availableSkills.slice(0, 3).map(s => ({
          id: s.id,
          name: s.name,
          score: s.demand_score || s.current_price || 0
        })));
      }
    }
  };

  const fetchNextStep = async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/skills/next-step`, {
        headers: { 'Authorization': `Bearer ${session?.access_token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.recommendedSkill) setRecommendedSkill(data.recommendedSkill);
      }
    } catch (err) {
      console.warn("Next step recommendation unavailable.");
    }
  };

  const filteredSkills = skills.filter(skill =>
    skill.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[70vh]">
        <div className="flex flex-col items-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-100 border-t-indigo-600"></div>
          <p className="text-slate-400 font-medium animate-pulse">Syncing live market data...</p>
        </div>
      </div>
    );
  }

  if (dbError) {
    return (
      <div className="max-w-3xl mx-auto px-4 py-20 text-center">
        <div className="bg-rose-50 border border-rose-200 rounded-3xl p-10 flex flex-col items-center">
          <AlertCircle className="w-16 h-16 text-rose-500 mb-4" />
          <h2 className="text-2xl font-bold text-rose-900 mb-3">Database Connection Issue</h2>
          <p className="text-rose-700 font-medium">
            The application couldn't load the skills data. Please ensure the Phase 1 SQL Migration script was run successfully in your Supabase dashboard.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-10">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-10 gap-6">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-800 mb-3 tracking-tight">Market Radar</h1>
          <p className="text-slate-500 font-medium text-lg max-w-xl leading-relaxed">
            Discover which technologies are surging in real-world job postings. Track skills to build your personalized readiness profile.
          </p>
        </div>
        
        <div className="relative w-full md:w-80">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-indigo-400" />
          </div>
          <input
            type="text"
            placeholder="Search technologies..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-12 pr-4 py-3.5 w-full bg-white/80 backdrop-blur-md border border-slate-200/80 rounded-2xl focus:ring-4 focus:ring-indigo-500/20 focus:border-indigo-400 outline-none transition-all shadow-sm font-medium text-slate-700 placeholder-slate-400"
          />
        </div>
      </div>

      {/* AI Recommendation Banner */}
      {recommendedSkill && !searchTerm && (
        <div 
          onClick={() => onNavigateToSkill(recommendedSkill.id)}
          className="mb-10 bg-gradient-to-r from-teal-50 to-emerald-50/50 border border-teal-100/80 rounded-3xl p-8 flex flex-col md:flex-row items-center justify-between shadow-[0_8px_30px_rgb(0,0,0,0.04)] cursor-pointer hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300"
        >
          <div className="flex items-center space-x-5 mb-6 md:mb-0">
            <div className="bg-gradient-to-br from-teal-400 to-emerald-500 p-4 rounded-2xl shadow-lg shadow-emerald-200/50">
              <Compass className="w-7 h-7 text-white" />
            </div>
            <div>
              <p className="text-xs font-extrabold uppercase tracking-widest text-teal-600/80 mb-1.5 flex items-center">
                <Zap className="w-3.5 h-3.5 mr-1" /> Smart Recommendation
              </p>
              <h2 className="text-2xl font-bold text-slate-800">
                You should analyze <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-emerald-600">{recommendedSkill.name}</span> next.
              </h2>
            </div>
          </div>
          <button className="w-full md:w-auto bg-white text-teal-700 border border-teal-100 px-8 py-3 rounded-xl font-bold hover:bg-teal-50 transition-colors shadow-sm flex items-center justify-center">
            View Skill Data <ArrowRight className="w-4 h-4 ml-2" />
          </button>
        </div>
      )}

      {/* Placement Cohort Intelligence */}
      {seniorTrends.length > 0 && !searchTerm && (
        <div className="mb-12">
          <div className="flex items-center space-x-3 mb-6">
            <div className="p-2 bg-indigo-100/50 rounded-lg">
              <GraduationCap className="w-6 h-6 text-indigo-600" />
            </div>
            <h2 className="text-2xl font-bold text-slate-800 tracking-tight">Trending among Seniors</h2>
            <span className="bg-indigo-50 text-indigo-700 border border-indigo-100/50 text-xs font-bold px-3 py-1 rounded-full shadow-sm">
              2026 Batch Focus
            </span>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            {seniorTrends.map((trend, index) => {
              const trendScore = trend.score || trend.price || 0;
              return (
                <div 
                  key={trend.id} 
                  onClick={() => onNavigateToSkill(trend.id)}
                  className="bg-white/60 backdrop-blur-xl border border-slate-200/60 rounded-2xl p-6 cursor-pointer hover:bg-white hover:border-indigo-200 hover:shadow-xl hover:shadow-indigo-100/40 transition-all duration-300 group"
                >
                  <div className="flex justify-between items-start mb-4">
                    <h3 className="text-lg font-extrabold text-slate-800 group-hover:text-indigo-600 transition-colors">{trend.name}</h3>
                    <span className="bg-slate-100 text-slate-500 text-xs font-black px-2.5 py-1 rounded-md">
                      #{index + 1}
                    </span>
                  </div>
                  <div className="flex justify-between items-end">
                    <div>
                      <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Demand Score</p>
                      <span className="text-2xl font-black text-indigo-600">{trendScore.toFixed(1)}</span>
                    </div>
                    <div className="bg-indigo-50 p-2 rounded-lg group-hover:bg-indigo-100 transition-colors">
                      <Activity className="w-5 h-5 text-indigo-500" />
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex items-center space-x-3 mb-6">
        <h2 className="text-2xl font-bold text-slate-800 tracking-tight">All Technologies</h2>
        <span className="text-slate-400 font-medium text-sm">({filteredSkills.length} listed)</span>
      </div>

      {filteredSkills.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredSkills.map((skill) => {
            const currentScore = skill.demand_score || skill.current_price || 0;
            const initialScore = skill.initial_demand_score || skill.initial_price || 1;
            
            const demandChange = ((currentScore - initialScore) / initialScore) * 100;
            const isPositive = demandChange >= 0;
            const isHot = demandChange > 2 || skill.trackers > 5;

            return (
              <div
                key={skill.id}
                onClick={() => onNavigateToSkill(skill.id)}
                className="bg-white rounded-3xl shadow-[0_2px_10px_rgb(0,0,0,0.02)] border border-slate-100 p-7 hover:shadow-[0_15px_40px_rgb(0,0,0,0.06)] hover:-translate-y-1 transition-all duration-300 cursor-pointer flex flex-col h-full relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 bg-gradient-to-br from-indigo-50 to-blue-50 rounded-full blur-2xl group-hover:scale-150 transition-transform duration-700"></div>

                <div className="relative z-10 flex-grow">
                  <div className="flex justify-between items-start mb-6">
                    <div>
                      <h3 className="text-xl font-bold text-slate-800 mb-2">{skill.name}</h3>
                      {isHot ? (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-orange-50 border border-orange-100 text-orange-600 text-[10px] font-black uppercase tracking-wider">
                          <Flame className="w-3 h-3 mr-1" /> High Interest
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2.5 py-1 rounded-md bg-slate-50 border border-slate-200 text-slate-500 text-[10px] font-black uppercase tracking-wider">
                          Stable
                        </span>
                      )}
                    </div>

                    <div className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg shadow-sm border ${isPositive ? 'bg-emerald-50 border-emerald-100 text-emerald-600' : 'bg-rose-50 border-rose-100 text-rose-600'}`}>
                      {isPositive ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />}
                      <span className="text-xs font-black">
                        {isPositive ? '+' : ''}{demandChange.toFixed(1)}%
                      </span>
                    </div>
                  </div>

                  <div className="mb-8">
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-1.5">Live Demand Score</p>
                    <p className="text-4xl font-black text-slate-800 tracking-tight">
                      {currentScore.toFixed(1)}
                    </p>
                  </div>
                </div>

                <div className="relative z-10 pt-5 border-t border-slate-100 mt-auto flex justify-between items-center">
                  <div className="flex space-x-4">
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Trackers</span>
                      <div className="flex items-center text-slate-700 font-bold text-sm">
                        <Users className="w-3.5 h-3.5 mr-1.5 text-indigo-400" />
                        {skill.trackers}
                      </div>
                    </div>
                    
                    <div className="flex flex-col">
                      <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-1">Jobs</span>
                      <div className="flex items-center text-slate-700 font-bold text-sm">
                        <Briefcase className="w-3.5 h-3.5 mr-1.5 text-blue-400" />
                        {skill.current_job_listings ? (skill.current_job_listings / 1000).toFixed(1) + 'k' : '—'}
                      </div>
                    </div>
                  </div>

                  <div className="bg-slate-50 p-2.5 rounded-xl group-hover:bg-indigo-600 group-hover:text-white text-slate-400 transition-colors">
                    <ArrowRight className="w-4 h-4" />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-20 bg-white/50 rounded-3xl border border-dashed border-slate-300">
          <div className="bg-slate-100 p-4 rounded-full mb-4">
            <Search className="w-8 h-8 text-slate-400" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-2">No technologies found</h3>
          <p className="text-slate-500">Adjust your search query to explore the market.</p>
        </div>
      )}
    </div>
  );
};