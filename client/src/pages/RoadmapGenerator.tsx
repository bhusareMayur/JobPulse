import { useState } from 'react';
import { 
  Map, Target, CheckCircle2, Zap, BookOpen, Clock, 
  Code2, Server, Database, ArrowRight, Loader2, Sparkles, 
  Rocket, Layout, Brain, Cloud, Terminal, BarChart, Smartphone, Layers, ShieldCheck
} from 'lucide-react';
import { supabase } from '../lib/supabase'; // <-- Import Supabase to pass the auth token

// 1. Icon Mapper: Converts the AI's string output into actual React components
const ICON_MAP: Record<string, any> = {
  Server, Database, ShieldCheck, Zap, Cloud, Layout, 
  Layers, BarChart, CheckCircle2, Terminal, Brain, 
  Sparkles, Rocket, Code2, Smartphone, Map
};

const ROLES = [
  'Backend Developer', 
  'React Developer', 
  'AI/ML Engineer', 
  'Full-Stack Developer',
  'DevOps Engineer',
  'Cloud Architect',
  'Cybersecurity Specialist'
];

export const RoadmapGenerator = () => {
  const [targetRole, setTargetRole] = useState(ROLES[0]);
  const [currentSkills, setCurrentSkills] = useState('');
  const [duration, setDuration] = useState('30');
  
  const [isGenerating, setIsGenerating] = useState(false);
  const [roadmap, setRoadmap] = useState<any[] | null>(null);
  const [error, setError] = useState('');
  const [completedTasks, setCompletedTasks] = useState<Set<string>>(new Set());

  const handleGenerate = async () => {
    setIsGenerating(true);
    setRoadmap(null);
    setError('');
    setCompletedTasks(newSet => { newSet.clear(); return newSet; });

    try {
      // Get the user's secure token
      const { data: { session } } = await supabase.auth.getSession();
      
      // Call your Node.js backend
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/roadmap/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ targetRole, currentSkills, duration })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to generate roadmap');
      }

      // Map the string icon names returned by AI to the actual Lucide components
      const processedRoadmap = result.roadmap.map((milestone: any) => ({
        ...milestone,
        icon: ICON_MAP[milestone.iconName] || CheckCircle2 // Fallback icon
      }));

      setRoadmap(processedRoadmap);
    } catch (err: any) {
      console.error(err);
      setError(err.message);
    } finally {
      setIsGenerating(false);
    }
  };

  const toggleTask = (taskName: string) => {
    const newSet = new Set(completedTasks);
    if (newSet.has(taskName)) newSet.delete(taskName);
    else newSet.add(taskName);
    setCompletedTasks(newSet);
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      
      {/* Hero Header (Keep exactly as it was) */}
      <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl">
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-purple-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="relative z-10">
          <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-purple-200 text-xs font-bold tracking-wider uppercase mb-4 border border-white/10">
            <Sparkles className="w-4 h-4 text-purple-400" />
            <span>AI Action Plan Generator</span>
          </div>
          <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Personalized Learning Roadmap</h1>
          <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
            Stop guessing what to learn next. Input your current stack and target role, and our AI will generate a highly actionable, day-by-day mastery plan tailored to your existing knowledge.
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Form Setup */}
        <div className="lg:col-span-1 space-y-6">
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 sticky top-24">
            <h2 className="text-xl font-bold text-slate-900 mb-6 flex items-center">
              <Target className="w-5 h-5 mr-2 text-indigo-600" />
              Configure Plan
            </h2>

            <div className="space-y-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Target Role</label>
                <select 
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700"
                >
                  {ROLES.map(role => <option key={role} value={role}>{role}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Current Skills (Optional)</label>
                <input 
                  type="text"
                  placeholder="e.g., Python, basic SQL, Git"
                  value={currentSkills}
                  onChange={(e) => setCurrentSkills(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">Timeline Focus</label>
                <div className="flex space-x-2">
                  <button 
                    onClick={() => setDuration('30')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${duration === '30' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    30 Days
                  </button>
                  <button 
                    onClick={() => setDuration('60')}
                    className={`flex-1 py-2.5 rounded-xl text-sm font-bold transition-all border ${duration === '60' ? 'bg-indigo-50 border-indigo-200 text-indigo-700 shadow-sm' : 'bg-white border-slate-200 text-slate-500 hover:bg-slate-50'}`}
                  >
                    60 Days
                  </button>
                </div>
              </div>

              {error && (
                <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg font-medium border border-red-100">
                  {error}
                </div>
              )}

              <button 
                onClick={handleGenerate}
                disabled={isGenerating}
                className="w-full mt-4 bg-slate-900 text-white py-3.5 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed group"
              >
                {isGenerating ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    <span>AI is computing...</span>
                  </>
                ) : (
                  <>
                    <span>Generate Personalized Plan</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Roadmap Display */}
        <div className="lg:col-span-2">
          {isGenerating ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-12 flex flex-col items-center justify-center h-full min-h-[400px]">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500 blur-xl opacity-20 rounded-full animate-pulse"></div>
                <div className="bg-white p-4 rounded-full shadow-xl relative z-10">
                  <Brain className="w-10 h-10 text-indigo-600 animate-[pulse_1.5s_ease-in-out_infinite]" />
                </div>
              </div>
              <h3 className="mt-6 text-xl font-bold text-slate-900">Synthesizing Learning Path</h3>
              <p className="text-slate-500 mt-2 text-center max-w-sm">
                Our AI is currently cross-referencing your skills with live market requirements for {targetRole}...
              </p>
            </div>
          ) : roadmap ? (
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-8 border-b border-slate-100 pb-6 gap-4">
                <div>
                  <h2 className="text-2xl font-extrabold text-slate-900">{targetRole} Mastery</h2>
                  <p className="text-sm font-bold text-indigo-600 mt-1 uppercase tracking-wider">{duration}-Day Action Plan</p>
                </div>
                <div className="bg-emerald-50 text-emerald-700 px-4 py-2 rounded-xl font-bold text-sm border border-emerald-100 flex items-center whitespace-nowrap">
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  {completedTasks.size} Tasks Done
                </div>
              </div>

              {/* Vertical Timeline */}
              <div className="relative border-l-2 border-slate-100 ml-4 space-y-10 pb-4">
                {roadmap.map((milestone, idx) => {
                  const Icon = milestone.icon;
                  const isFastTrack = idx === 0 && currentSkills.trim().length > 0;

                  return (
                    <div key={idx} className="relative pl-8">
                      {/* Timeline Node */}
                      <div className={`absolute -left-[17px] top-1 w-8 h-8 rounded-full border-4 border-white ${milestone.bg} flex items-center justify-center shadow-sm`}>
                        <Icon className={`w-3.5 h-3.5 ${milestone.color}`} />
                      </div>

                      <div className={`bg-slate-50 border ${isFastTrack ? 'border-rose-200 shadow-sm' : 'border-slate-100'} rounded-2xl p-6 hover:shadow-md transition-shadow group`}>
                        <div className="flex items-center space-x-2 mb-2">
                          <span className={`text-xs font-black uppercase tracking-widest px-2 py-1 rounded shadow-sm border ${
                            isFastTrack ? 'bg-rose-100 text-rose-700 border-rose-200' : 'text-slate-400 bg-white border-slate-100'
                          }`}>
                            {milestone.day}
                          </span>
                          {isFastTrack && (
                            <span className="flex items-center text-xs font-bold text-rose-500 bg-rose-50 px-2 py-1 rounded-md">
                              <Rocket className="w-3 h-3 mr-1" /> AI Fast-Tracked
                            </span>
                          )}
                        </div>
                        
                        <h3 className="text-xl font-bold text-slate-900 mb-2">{milestone.title}</h3>
                        <p className="text-sm text-slate-600 mb-6 leading-relaxed">{milestone.desc}</p>
                        
                        <div className="space-y-3">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center">
                            <BookOpen className="w-3 h-3 mr-1" /> Action Items
                          </h4>
                          {milestone.tasks.map((task: string, taskIdx: number) => {
                            const isDone = completedTasks.has(task);
                            return (
                              <div 
                                key={taskIdx}
                                onClick={() => toggleTask(task)}
                                className={`flex items-center p-3 rounded-xl border transition-all cursor-pointer ${
                                  isDone 
                                    ? 'bg-emerald-50 border-emerald-200' 
                                    : 'bg-white border-slate-200 hover:border-indigo-300'
                                }`}
                              >
                                <div className={`w-5 h-5 rounded-md border flex items-center justify-center mr-3 shrink-0 transition-colors ${
                                  isDone ? 'bg-emerald-500 border-emerald-500' : 'bg-white border-slate-300 group-hover:border-indigo-400'
                                }`}>
                                  {isDone && <CheckCircle2 className="w-3.5 h-3.5 text-white" />}
                                </div>
                                <span className={`text-sm font-medium transition-colors ${isDone ? 'text-emerald-700 line-through opacity-70' : 'text-slate-700'}`}>
                                  {task}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            <div className="bg-slate-50 rounded-3xl border border-dashed border-slate-300 p-12 flex flex-col items-center justify-center h-full min-h-[400px] text-center">
              <Map className="w-16 h-16 text-slate-300 mb-4" />
              <h3 className="text-xl font-bold text-slate-900 mb-2">No Roadmap Generated</h3>
              <p className="text-slate-500 max-w-md">Configure your role and enter any current skills on the left. The AI will instantly map out an accelerated learning journey just for you.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};