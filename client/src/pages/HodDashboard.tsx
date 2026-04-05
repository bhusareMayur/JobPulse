import { useState } from 'react';
import { 
  PieChart, Pie, Cell, ResponsiveContainer, Tooltip as RechartsTooltip, 
  BarChart, Bar, XAxis, YAxis, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar, Legend
} from 'recharts';
import { Lock, TrendingUp, Users, Activity, Download, Lightbulb, CheckCircle, Info, X, Trophy, Mail } from 'lucide-react';

const COLORS = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#14b8a6', '#f97316'];

export const HodDashboard = () => {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [showReadinessModal, setShowReadinessModal] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${import.meta.env.VITE_API_URL}/api/analytics/hod?pass=${password}`);
      if (!res.ok) {
        if (res.status === 401) throw new Error('Incorrect Admin Password');
        throw new Error('Server Error');
      }
      const json = await res.json();
      setData(json);
      setIsAuthenticated(true);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-4">
        <div className="bg-white p-8 rounded-2xl shadow-lg border border-slate-200 max-w-md w-full text-center transform transition-all hover:scale-[1.01]">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-md">
            <Lock className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">HOD Analytics Portal</h1>
          <p className="text-slate-500 mb-8 text-sm">Secure access for Department Heads and Placement Cells.</p>
          <form onSubmit={handleLogin} className="space-y-4">
            <input
              type="password"
              placeholder="Enter Administrative Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-slate-800 focus:bg-white outline-none transition-all text-center tracking-widest"
              required
            />
            {error && <p className="text-red-500 text-sm font-medium bg-red-50 py-2 rounded-lg">{error}</p>}
            <button type="submit" disabled={loading} className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200">
              {loading ? 'Verifying Identity...' : 'Secure Login'}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 py-12 print:bg-white print:py-0">
      
      {/* THE MODAL POPUP */}
      {showReadinessModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 print:hidden">
          <div className="bg-white rounded-3xl shadow-2xl max-w-lg w-full p-8 relative animate-in fade-in zoom-in duration-200">
            <button 
              onClick={() => setShowReadinessModal(false)} 
              className="absolute top-6 right-6 text-slate-400 hover:text-slate-800 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
            
            <h2 className="text-2xl font-extrabold text-slate-900 mb-6 flex items-center">
              <Activity className="w-6 h-6 mr-3 text-blue-600" />
              Placement Readiness
            </h2>
            
            <div className="space-y-6 text-slate-600">
              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-2">What is this score?</h3>
                <p className="text-sm leading-relaxed">
                  This score (out of 100) measures how accurately our students' technical skills align with live, real-world industry demand. It is calculated by measuring the variance between the percentage of students holding a specific technology and the percentage of active job listings asking for that technology on the JSearch API.
                </p>
              </div>
              
              <div className="bg-indigo-50 p-5 rounded-2xl border border-indigo-100">
                <h3 className="font-bold text-indigo-900 text-sm uppercase tracking-wider mb-2">Why is our score {data?.readinessScore}?</h3>
                <p className="text-sm font-medium text-indigo-800 leading-relaxed">{data?.insight}</p>
              </div>

              <div>
                <h3 className="font-bold text-slate-900 text-sm uppercase tracking-wider mb-3">Score Rubric</h3>
                <ul className="text-sm space-y-3">
                  <li className="flex items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="w-3 h-3 rounded-full bg-emerald-500 mr-3 shadow-sm"></span> 
                    <span><strong>70 - 100:</strong> Excellent Alignment. Curriculum is highly effective.</span>
                  </li>
                  <li className="flex items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="w-3 h-3 rounded-full bg-amber-500 mr-3 shadow-sm"></span> 
                    <span><strong>50 - 69:</strong> Moderate Alignment. Monitor student focus trends.</span>
                  </li>
                  <li className="flex items-center bg-slate-50 p-2 rounded-lg border border-slate-100">
                    <span className="w-3 h-3 rounded-full bg-red-500 mr-3 shadow-sm"></span> 
                    <span><strong>0 - 49:</strong> Critical Mismatch. Immediate workshops required.</span>
                  </li>
                </ul>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-slate-100">
              <button 
                onClick={() => setShowReadinessModal(false)} 
                className="w-full bg-slate-900 text-white px-6 py-3 rounded-xl font-bold hover:bg-slate-800 transition-colors shadow-lg shadow-slate-200"
              >
                Understood
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 print:hidden">
          <div>
            <span className="bg-slate-800 text-white px-3 py-1 rounded-full text-xs font-bold tracking-wider uppercase mb-3 inline-block">Directorate View</span>
            <h1 className="text-3xl font-extrabold text-slate-900 mt-1">Department Skill Intelligence</h1>
            <p className="text-slate-600 mt-1">Live simulation data mapping student interests against global hiring trends.</p>
          </div>
          <button 
            onClick={handlePrint}
            className="mt-4 md:mt-0 flex items-center space-x-2 bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-medium transition-all shadow-sm"
          >
            <Download className="w-5 h-5" />
            <span>Export PDF Report</span>
          </button>
        </div>

        {/* Print Only Header */}
        <div className="hidden print:block mb-8 border-b-2 border-slate-900 pb-4">
          <h1 className="text-4xl font-bold text-slate-900">JobPulse Placement Intelligence Report</h1>
          <p className="text-slate-600 mt-2">Generated on: {new Date().toLocaleDateString()}</p>
        </div>

        {/* Actionable Insights Panel */}
        <div className="bg-gradient-to-r from-indigo-50 to-blue-50 border border-indigo-100 p-6 rounded-2xl mb-8 flex items-start space-x-4 shadow-sm">
          <div className="bg-indigo-600 p-3 rounded-xl shadow-inner mt-1">
            <Lightbulb className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-bold text-indigo-900 mb-1">Automated Placement Insight</h3>
            <p className="text-indigo-800 font-medium leading-relaxed">{data?.insight}</p>
          </div>
        </div>

        {/* Top Stats & Readiness Score Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          
          <div 
            onClick={() => setShowReadinessModal(true)}
            className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200 flex flex-col items-center justify-center relative overflow-hidden lg:col-span-1 cursor-pointer hover:border-blue-300 hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-center space-x-2 mb-2 z-10 bg-white/80 px-4 py-1 rounded-full">
              <h2 className="text-sm font-bold text-slate-500 uppercase tracking-wider group-hover:text-blue-600 transition-colors">Placement Readiness</h2>
              <Info className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition-colors" />
            </div>
            
            <div className="w-full h-[180px] -mb-10 relative">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={[
                      { value: data?.readinessScore || 0, fill: (data?.readinessScore || 0) >= 70 ? '#10b981' : (data?.readinessScore || 0) >= 50 ? '#f59e0b' : '#ef4444' },
                      { value: 100 - (data?.readinessScore || 0), fill: '#f1f5f9' }
                    ]}
                    cx="50%" cy="100%"
                    startAngle={180} endAngle={0}
                    innerRadius={80} outerRadius={110}
                    dataKey="value"
                    stroke="none"
                    isAnimationActive={true}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="absolute bottom-0 left-0 right-0 text-center pb-4">
                <span className={`text-5xl font-extrabold transition-transform group-hover:scale-105 inline-block ${
                  (data?.readinessScore || 0) >= 70 ? 'text-emerald-500' 
                  : (data?.readinessScore || 0) >= 50 ? 'text-amber-500' 
                  : 'text-red-500'
                }`}>
                  {data?.readinessScore || 0}
                </span>
                <span className="text-slate-400 text-xl font-bold">/100</span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 lg:col-span-2">
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-blue-50 p-2.5 rounded-lg"><Users className="w-5 h-5 text-blue-600"/></div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Active Students</p>
              </div>
              <p className="text-4xl font-extrabold text-slate-900">{data?.totalUsers}</p>
            </div>
            
            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-emerald-50 p-2.5 rounded-lg"><Activity className="w-5 h-5 text-emerald-600"/></div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Total Engagements</p>
              </div>
              <p className="text-4xl font-extrabold text-slate-900">{data?.totalTrades}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-amber-50 p-2.5 rounded-lg"><CheckCircle className="w-5 h-5 text-amber-600"/></div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Top Student Pick</p>
              </div>
              <p className="text-xl font-bold text-slate-900 truncate" title={data?.chartData[0]?.name}>{data?.chartData[0]?.name || 'N/A'}</p>
            </div>

            <div className="bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
              <div className="flex items-center space-x-3 mb-4">
                <div className="bg-purple-50 p-2.5 rounded-lg"><TrendingUp className="w-5 h-5 text-purple-600"/></div>
                <p className="text-sm text-slate-500 font-bold uppercase tracking-wider">Top Industry Need</p>
              </div>
              <p className="text-xl font-bold text-slate-900 truncate" title={data?.topMarketSkill}>{data?.topMarketSkill || 'N/A'}</p>
            </div>
          </div>
        </div>

        {/* --- NEW: TOP TALENT WATCHLIST --- */}
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200 mb-8">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between mb-6">
            <div className="flex items-center">
              <div className="bg-amber-100 p-3 rounded-xl mr-4 shadow-inner">
                <Trophy className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-slate-900">Top Market Analysts (Placement Watchlist)</h2>
                <p className="text-sm text-slate-500">Highest performing students based on simulated portfolio growth and market accuracy.</p>
              </div>
            </div>
          </div>
          
          <div className="overflow-x-auto rounded-xl border border-slate-100">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-slate-500 text-xs uppercase tracking-wider">
                  <th className="p-4 font-bold border-b border-slate-100 w-16 text-center">Rank</th>
                  <th className="p-4 font-bold border-b border-slate-100">Student Name</th>
                  <th className="p-4 font-bold border-b border-slate-100">Contact Email</th>
                  <th className="p-4 font-bold border-b border-slate-100">Top Asset Focus</th>
                  <th className="p-4 font-bold border-b border-slate-100 text-right">Portfolio Value</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data?.topAnalysts?.map((analyst: any) => (
                  <tr key={analyst.id} className="hover:bg-slate-50 transition-colors">
                    <td className="p-4 text-center">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold text-sm shadow-sm ${
                        analyst.rank === 1 ? 'bg-gradient-to-br from-yellow-300 to-amber-500 text-white' :
                        analyst.rank === 2 ? 'bg-gradient-to-br from-slate-300 to-slate-400 text-white' :
                        analyst.rank === 3 ? 'bg-gradient-to-br from-orange-300 to-orange-500 text-white' :
                        'bg-slate-100 text-slate-500'
                      }`}>
                        {analyst.rank}
                      </span>
                    </td>
                    <td className="p-4 font-bold text-slate-900">{analyst.name}</td>
                    <td className="p-4 text-slate-500">
                      <div className="flex items-center">
                        <Mail className="w-4 h-4 mr-2 opacity-50" />
                        <a href={`mailto:${analyst.email}`} className="hover:text-blue-600 transition-colors">{analyst.email}</a>
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-blue-50 text-blue-700 px-3 py-1 rounded-full text-xs font-bold border border-blue-100 whitespace-nowrap">
                        {analyst.topSkill}
                      </span>
                    </td>
                    <td className="p-4 text-right font-bold text-emerald-600 whitespace-nowrap">
                      {analyst.wealth.toLocaleString()} JC
                    </td>
                  </tr>
                ))}
                
                {/* Fallback if no trades have happened yet */}
                {(!data?.topAnalysts || data.topAnalysts.length === 0) && (
                  <tr>
                    <td colSpan={5} className="p-8 text-center text-slate-500 font-medium italic">
                      Market hasn't opened yet. Student data will populate here once trades begin.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        {/* --- END TOP TALENT WATCHLIST --- */}

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-2">Student Focus vs. Market Reality</h2>
            <p className="text-sm text-slate-500 mb-6">Compares what students are learning against what companies are currently hiring for.</p>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="80%" data={data?.chartData?.slice(0, 6)}>
                  <PolarGrid stroke="#e2e8f0" />
                  <PolarAngleAxis dataKey="name" tick={{fill: '#475569', fontSize: 12, fontWeight: 500}} />
                  <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                  <Radar name="Student Focus" dataKey="studentScore" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.4} />
                  <Radar name="Market Demand" dataKey="marketScore" stroke="#10b981" fill="#10b981" fillOpacity={0.4} />
                  <Legend wrapperStyle={{ paddingTop: '20px' }} />
                  <RechartsTooltip />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-bold text-slate-900 mb-6">Top Student Investments (Volume)</h2>
            <div className="h-[300px]">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={data?.chartData?.slice(0, 6)} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                  <XAxis type="number" hide />
                  <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{fill: '#475569', fontWeight: 600}} width={120} />
                  <RechartsTooltip 
                    cursor={{fill: '#f8fafc'}} 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }}
                  />
                  <Bar dataKey="value" name="Total Units Held" fill="#3b82f6" radius={[0, 6, 6, 0]} barSize={24}>
                    {data?.chartData?.slice(0, 6).map((_entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
};