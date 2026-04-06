import { useEffect, useState, useCallback } from 'react';
import { 
  ArrowLeft, TrendingUp, TrendingDown, Briefcase, Clock, 
  BookOpen, Youtube, Map, ExternalLink, BookmarkPlus, 
  BookmarkMinus, AlertCircle, Users, Activity, Flame,
  Target, BrainCircuit, Crown, Sparkles, Code, Terminal, Rocket
} from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useMutation } from '@tanstack/react-query';

type Timeframe = '1H' | '1D' | '1W' | 'ALL';
type TrackStatus = 'interested' | 'learning' | 'mastered';

export const SkillDetail = ({ skillId, onBack }: { skillId: string, onBack: () => void }) => {
  const [skill, setSkill] = useState<any>(null);
  const [priceHistory, setPriceHistory] = useState<any[]>([]);
  const [trackerCount, setTrackerCount] = useState<number>(0);
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  
  const [isTracked, setIsTracked] = useState(false);
  const [trackingStatus, setTrackingStatus] = useState<TrackStatus>('interested');
  const [fetchError, setFetchError] = useState<string | null>(null);
  
  const { user } = useAuth();
  const currentHour = new Date().getHours();
  const isMarketClosed = currentHour >= 21 || currentHour < 9; 

  const fetchTrackingData = useCallback(async () => {
    if (!user?.id) return;
    try {
      const { data: userData } = await supabase
        .from('tracked_skills')
        .select('id, status')
        .eq('user_id', user.id)
        .eq('skill_id', skillId)
        .maybeSingle();

      if (userData) {
        setIsTracked(true);
        setTrackingStatus(userData.status as TrackStatus);
      } else {
        setIsTracked(false);
      }

      const { count } = await supabase
        .from('tracked_skills')
        .select('*', { count: 'exact', head: true })
        .eq('skill_id', skillId);
      
      setTrackerCount(count || 0);
    } catch (err) {
      console.error("Tracking fetch error:", err);
    }
  }, [user?.id, skillId]);

  useEffect(() => {
    fetchSkillData();
    fetchTrackingData();
  }, [skillId, timeframe, fetchTrackingData]);

  const fetchSkillData = async () => {
    setFetchError(null);
    try {
      let historyQuery = supabase
        .from('demand_history')
        .select('*')
        .eq('skill_id', skillId)
        .order('created_at', { ascending: true });

      if (timeframe !== 'ALL') {
        const now = new Date();
        let pastDate = new Date();
        if (timeframe === '1H') pastDate.setHours(now.getHours() - 1);
        if (timeframe === '1D') pastDate.setDate(now.getDate() - 1);
        if (timeframe === '1W') pastDate.setDate(now.getDate() - 7);
        historyQuery = historyQuery.gte('created_at', pastDate.toISOString());
      } else {
        historyQuery = historyQuery.limit(500); 
      }

      const [skillRes, historyRes] = await Promise.all([
        supabase.from('skills').select('*').eq('id', skillId).single(),
        historyQuery,
      ]);

      if (skillRes.error) throw new Error(skillRes.error.message);
      setSkill(skillRes.data);
      setPriceHistory(historyRes.data || []);
    } catch (err: any) {
      console.error("Failed to load skill:", err);
      setFetchError(err.message || "Failed to load skill data.");
    }
  };

  const trackMutation = useMutation({
    mutationFn: async ({ action, status }: { action: 'track' | 'untrack', status?: TrackStatus }) => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/track`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ skillId, action, status: status || 'interested' })
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error);
      return { action, status };
    },
    onSuccess: (data) => {
      if (data.action === 'untrack') {
        setIsTracked(false);
        setTrackerCount(prev => Math.max(0, prev - 1));
      } else {
        if (!isTracked) setTrackerCount(prev => prev + 1);
        setIsTracked(true);
        if (data.status) setTrackingStatus(data.status);
      }
    }
  });

  if (fetchError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center">
        <button onClick={onBack} className="flex items-center space-x-2 text-slate-400 hover:text-slate-800 font-bold mb-8 transition-colors">
          <ArrowLeft className="w-5 h-5" /> <span>Back to Market Radar</span>
        </button>
        <div className="bg-rose-50 border border-rose-100 rounded-3xl p-12 flex flex-col items-center shadow-sm">
          <AlertCircle className="w-16 h-16 text-rose-400 mb-4" />
          <h2 className="text-2xl font-bold text-rose-900 mb-2">Data Unavailable</h2>
          <p className="text-rose-600 font-medium">{fetchError}</p>
        </div>
      </div>
    );
  }

  if (!skill) {
    return (
      <div className="flex flex-col items-center justify-center h-[60vh]">
        <div className="relative">
          <div className="absolute inset-0 bg-indigo-500 rounded-full blur-xl opacity-20 animate-pulse"></div>
          <div className="animate-spin rounded-full h-14 w-14 border-4 border-indigo-100 border-t-indigo-600 relative z-10"></div>
        </div>
        <p className="text-slate-400 font-bold tracking-widest uppercase mt-6 animate-pulse text-sm">Loading Intelligence...</p>
      </div>
    );
  }

  const currentScore = skill.demand_score || skill.current_price || 0;
  const initialScore = skill.initial_demand_score || skill.initial_price || 1; 
  const jobListings = skill.current_job_listings || 0;

  const demandChange = ((currentScore - initialScore) / initialScore) * 100;
  const isPositive = demandChange >= 0;
  const isHot = demandChange > 2 || trackerCount > 5;

  const chartData = priceHistory.map(p => {
    const date = new Date(p.created_at);
    let timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    if (timeframe === '1W' || timeframe === 'ALL') timeLabel = `${date.getDate()}/${date.getMonth() + 1} ${timeLabel}`;
    return { time: timeLabel, score: p.score || p.price || 0 };
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button onClick={onBack} className="flex items-center space-x-2 text-slate-500 hover:text-indigo-600 font-bold mb-6 transition-colors group">
        <ArrowLeft className="w-5 h-5 group-hover:-translate-x-1 transition-transform" /> 
        <span>Market Radar</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column (Main Data) */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Premium Header Block */}
          <div className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 p-8 relative overflow-hidden text-white">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500 rounded-full blur-[100px] opacity-20 pointer-events-none"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-emerald-500 rounded-full blur-[80px] opacity-10 pointer-events-none"></div>
            
            <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
              <div>
                <div className="flex items-center space-x-3 mb-3">
                  <div className="bg-white/10 p-2.5 rounded-xl border border-white/5 backdrop-blur-md">
                    <Code className="w-6 h-6 text-indigo-300" />
                  </div>
                  <h1 className="text-4xl font-extrabold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-slate-300">
                    {skill.name}
                  </h1>
                </div>
                
                {/* Skill DNA Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  {isHot && (
                    <span className="inline-flex items-center px-3 py-1 rounded-full bg-orange-500/20 border border-orange-500/30 text-orange-400 text-xs font-bold uppercase tracking-wider">
                      <Flame className="w-3 h-3 mr-1.5" /> Surging Demand
                    </span>
                  )}
                  <span className="inline-flex items-center px-3 py-1 rounded-full bg-blue-500/20 border border-blue-500/30 text-blue-400 text-xs font-bold uppercase tracking-wider">
                    <Sparkles className="w-3 h-3 mr-1.5" /> High ROI
                  </span>
                </div>
                
                <div className="flex items-end space-x-4">
                  <div className="flex flex-col">
                    <span className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1">Live Score</span>
                    <span className="text-5xl font-black tracking-tight">{currentScore.toFixed(1)}</span>
                  </div>
                  <div className={`flex items-center space-x-1.5 px-3 py-2 rounded-xl border mb-1 backdrop-blur-md ${isPositive ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-rose-500/10 border-rose-500/20 text-rose-400'}`}>
                    {isPositive ? <TrendingUp className="w-5 h-5" /> : <TrendingDown className="w-5 h-5" />}
                    <span className="font-bold text-sm">{isPositive ? '+' : ''}{demandChange.toFixed(2)}%</span>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col space-y-3 w-full md:w-auto">
                <button 
                  onClick={() => trackMutation.mutate({ action: isTracked ? 'untrack' : 'track' })}
                  disabled={trackMutation.isPending || isMarketClosed}
                  className={`flex items-center space-x-2 px-8 py-4 rounded-2xl font-bold transition-all duration-300 justify-center ${
                    isTracked 
                      ? 'bg-white/10 text-white hover:bg-rose-500/20 hover:text-rose-300 hover:border-rose-500/30 border border-white/20' 
                      : 'bg-indigo-500 text-white hover:bg-indigo-400 hover:shadow-[0_0_30px_rgba(99,102,241,0.4)] hover:-translate-y-1'
                  } disabled:opacity-50 disabled:hover:translate-y-0`}
                >
                  {trackMutation.isPending ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> 
                  : isTracked ? <><BookmarkMinus className="w-5 h-5" /> <span>Untrack Skill</span></> 
                  : <><BookmarkPlus className="w-5 h-5" /> <span>Add to Portfolio</span></>}
                </button>
              </div>
            </div>
          </div>

          {/* The Learning Journey Tracker */}
          {isTracked && (
            <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
              <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
                <Crown className="w-5 h-5 mr-2 text-indigo-500" /> Your Learning Journey
              </h2>
              
              <div className="grid grid-cols-3 gap-4">
                {[
                  { id: 'interested', label: 'Interested', icon: Target, desc: 'Planning to learn' },
                  { id: 'learning', label: 'Learning', icon: BrainCircuit, desc: 'Actively studying' },
                  { id: 'mastered', label: 'Mastered', icon: Crown, desc: 'Ready for interviews' }
                ].map((step) => {
                  const isActive = trackingStatus === step.id;
                  const Icon = step.icon;
                  return (
                    <button
                      key={step.id}
                      onClick={() => trackMutation.mutate({ action: 'track', status: step.id as TrackStatus })}
                      disabled={trackMutation.isPending}
                      className={`relative flex flex-col items-center justify-center p-4 rounded-2xl border transition-all duration-300 overflow-hidden ${
                        isActive 
                          ? 'bg-indigo-50 border-indigo-500 shadow-md transform -translate-y-1' 
                          : 'bg-slate-50 border-slate-200 hover:bg-slate-100 hover:border-slate-300'
                      }`}
                    >
                      {isActive && <div className="absolute inset-0 bg-gradient-to-b from-indigo-500/10 to-transparent pointer-events-none"></div>}
                      <Icon className={`w-8 h-8 mb-2 ${isActive ? 'text-indigo-600' : 'text-slate-400'}`} />
                      <span className={`font-bold ${isActive ? 'text-indigo-900' : 'text-slate-600'}`}>{step.label}</span>
                      <span className="text-[10px] text-slate-400 font-medium uppercase mt-1 hidden sm:block">{step.desc}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Chart Block */}
          <div className="bg-white/80 backdrop-blur-xl rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-8">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-indigo-50 rounded-lg">
                  <Activity className="w-5 h-5 text-indigo-600" />
                </div>
                <h2 className="text-xl font-bold text-slate-800">Demand Trajectory</h2>
              </div>
              
              <div className="flex space-x-1 bg-slate-100/80 p-1.5 rounded-xl mt-4 sm:mt-0 border border-slate-200/50">
                {(['1H', '1D', '1W', 'ALL'] as Timeframe[]).map((tf) => (
                  <button 
                    key={tf} 
                    onClick={() => setTimeframe(tf)} 
                    className={`px-5 py-1.5 text-sm font-bold rounded-lg transition-all ${timeframe === tf ? 'bg-white text-indigo-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-80 w-full relative">
              {priceHistory.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? '#10b981' : '#6366f1'} stopOpacity={0.2}/>
                        <stop offset="95%" stopColor={isPositive ? '#10b981' : '#6366f1'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Tooltip 
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }} 
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px' }} 
                      labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }} 
                      formatter={(value: number) => [<span className="font-bold text-slate-800">Score: {value.toFixed(1)}</span>, '']} 
                    />
                    <Area type="monotone" dataKey="score" stroke={isPositive ? '#10b981' : '#6366f1'} strokeWidth={4} fillOpacity={1} fill="url(#colorPrice)" isAnimationActive={false} />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 bg-slate-50/50 rounded-2xl border border-dashed border-slate-200">
                  <Activity className="w-8 h-8 mb-2 text-slate-300" />
                  <span className="font-medium">Gathering trend data...</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Sidebar */}
        <div className="lg:col-span-1 space-y-6">
          
          {/* Enhanced Market Reality Card */}
          <div className="bg-gradient-to-br from-indigo-50 to-blue-50 rounded-3xl shadow-sm border border-indigo-100 p-7 relative overflow-hidden">
            <h2 className="text-xl font-bold mb-6 flex items-center text-slate-800 tracking-tight">
              <Briefcase className="w-5 h-5 mr-2.5 text-indigo-500" /> Market Reality
            </h2>
            
            <div className="space-y-4 relative z-10">
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Active Job Listings</p>
                <p className="text-3xl font-black tracking-tight text-slate-800">{jobListings ? jobListings.toLocaleString() : 'Syncing...'}</p>
              </div>
              
              <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                <p className="text-slate-400 text-[10px] font-black uppercase tracking-widest mb-1.5">Students Tracking</p>
                <div className="flex items-center text-3xl font-black tracking-tight text-slate-800">
                  <Users className="w-6 h-6 mr-3 text-indigo-500" />
                  {trackerCount}
                </div>
              </div>
            </div>
          </div>

          {/* 🔥 ENHANCED ACTION PLAN CARD */}
          <div className="bg-white/80 backdrop-blur-xl border border-slate-100 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] p-7 relative overflow-hidden">
            
            {/* Subtle background flair */}
            <div className="absolute -right-10 -top-10 w-40 h-40 bg-indigo-50 rounded-full blur-3xl opacity-60"></div>
            
            <div className="flex items-center space-x-3 mb-6 relative z-10">
              <div className="bg-gradient-to-br from-indigo-500 to-blue-600 p-2.5 rounded-xl shadow-lg shadow-indigo-200 text-white">
                <Rocket className="w-5 h-5" />
              </div>
              <h2 className="text-xl font-bold text-slate-800 tracking-tight">Action Plan</h2>
            </div>
            
            <div className="space-y-4 relative z-10">
              {/* Option 1: Video Course */}
              <a href={`https://www.youtube.com/results?search_query=${encodeURIComponent(skill.name + ' full course tutorial')}`} target="_blank" rel="noopener noreferrer" 
                 className="flex items-center p-4 rounded-2xl border border-slate-100 bg-white hover:border-red-200 hover:shadow-md transition-all duration-300 group">
                <div className="p-3 bg-red-50 text-red-600 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Youtube className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">Video Crash Course</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Visual step-by-step guides</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-red-500 transition-colors" />
                </div>
              </a>

              {/* Option 2: Roadmap */}
              <a href={`https://roadmap.sh/search?q=${encodeURIComponent(skill.name)}`} target="_blank" rel="noopener noreferrer" 
                 className="flex items-center p-4 rounded-2xl border border-slate-100 bg-white hover:border-amber-200 hover:shadow-md transition-all duration-300 group">
                <div className="p-3 bg-amber-50 text-amber-600 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Map className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">Interactive Roadmap</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Structured learning paths</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition-colors" />
                </div>
              </a>

              {/* Option 3: Documentation */}
              <a href={`https://www.google.com/search?q=${encodeURIComponent(skill.name + ' official documentation tutorial')}`} target="_blank" rel="noopener noreferrer" 
                 className="flex items-center p-4 rounded-2xl border border-slate-100 bg-white hover:border-blue-200 hover:shadow-md transition-all duration-300 group">
                <div className="p-3 bg-blue-50 text-blue-600 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <BookOpen className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">Official Docs</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Deep dive into the syntax</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
                </div>
              </a>

              {/* Option 4: Projects */}
              <a href={`https://github.com/search?q=${encodeURIComponent('build a ' + skill.name + ' project')}`} target="_blank" rel="noopener noreferrer" 
                 className="flex items-center p-4 rounded-2xl border border-slate-100 bg-white hover:border-emerald-200 hover:shadow-md transition-all duration-300 group">
                <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl mr-4 group-hover:scale-110 transition-transform duration-300">
                  <Terminal className="w-5 h-5" />
                </div>
                <div className="flex-1">
                  <h3 className="font-bold text-slate-800 text-sm group-hover:text-indigo-600 transition-colors">Build Projects</h3>
                  <p className="text-xs text-slate-500 font-medium mt-0.5">Learn by writing code</p>
                </div>
                <div className="bg-slate-50 p-2 rounded-full opacity-0 group-hover:opacity-100 transition-all duration-300 -translate-x-2 group-hover:translate-x-0">
                  <ExternalLink className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition-colors" />
                </div>
              </a>
            </div>
          </div>

          {/* Academic Mode Warning */}
          {isMarketClosed && (
            <div className="bg-amber-50 border border-amber-100 rounded-3xl p-6 flex items-start space-x-4 shadow-sm">
              <div className="bg-amber-100 p-2 rounded-xl mt-0.5 flex-shrink-0">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm font-bold text-amber-900 mb-1">Academic Mode Active</p>
                <p className="text-xs text-amber-800 leading-relaxed font-medium">
                  Tracking updates are paused during typical lecture hours to ensure focus. You can still analyze the market data.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};