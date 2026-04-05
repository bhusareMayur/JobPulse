import { useState } from 'react';
import { Target, TrendingUp, ChevronRight, Zap, ShieldCheck, Cpu, Code2, LineChart, Award, ArrowUpRight } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { useNavigate } from 'react-router-dom';

const COMPANIES = [
  {
    id: 'accenture',
    name: 'Accenture',
    category: 'Service / Consulting',
    difficulty: 'Medium',
    theme: 'from-purple-600 to-indigo-600',
    border: 'border-purple-200',
    bg: 'bg-purple-50/50',
    iconBg: 'bg-purple-100',
    badge: 'Top Recruiter',
    skills: [
      { name: 'Full Stack Developer', match: 78, icon: Code2 },
      { name: 'Cloud & DevOps', match: 65, icon: Cpu },
      { name: 'Data Analytics', match: 70, icon: LineChart },
      { name: 'Java Developer', match: 75, icon: Zap }
    ],
    insight: 'Accenture focuses on adaptable engineers with strong fundamentals. Cloud, full-stack development, and problem-solving skills significantly increase chances for ASE and advanced roles.',
    trends: [
      { year: '2023', hires: 90 },
      { year: '2024', hires: 80 },
      { year: '2025', hires: 100 },
      { year: 'Proj 2026', hires: 110 }
    ]
  },

  {
    id: 'tcs',
    name: 'TCS',
    category: 'Service / Mass',
    difficulty: 'Medium',
    theme: 'from-blue-600 to-indigo-600',
    border: 'border-blue-200',
    bg: 'bg-blue-50/50',
    iconBg: 'bg-blue-100',
    badge: 'Mass Recruiter',
    skills: [
      { name: 'Aptitude & Problem Solving', match: 85, icon: Cpu },
      { name: 'Java / Python', match: 75, icon: Code2 },
      { name: 'SQL & DBMS', match: 65, icon: LineChart },
      { name: 'Basic Web Dev', match: 55, icon: Zap }
    ],
    insight: 'TCS hiring heavily depends on aptitude + coding rounds. Strong basics and consistency matter more than advanced tech stacks.',
    trends: [
      { year: '2023', hires: 170 },
      { year: '2024', hires: 150 },
      { year: '2025', hires: 189 },
      { year: 'Proj 2026', hires: 200 }
    ]
  },

  {
    id: 'capgemini',
    name: 'Capgemini',
    category: 'Service / Consulting',
    difficulty: 'Medium',
    theme: 'from-teal-500 to-cyan-600',
    border: 'border-teal-200',
    bg: 'bg-teal-50/50',
    iconBg: 'bg-teal-100',
    badge: 'Engineering Focus',
    skills: [
      { name: 'Java Developer', match: 80, icon: Code2 },
      { name: 'SQL & DBMS', match: 70, icon: LineChart },
      { name: 'Cloud Basics', match: 55, icon: Cpu },
      { name: 'Testing & QA', match: 50, icon: Zap }
    ],
    insight: 'Capgemini prefers strong coding fundamentals with Java and SQL. Practical understanding of SDLC and testing gives an edge.',
    trends: [
      { year: '2023', hires: 50 },
      { year: '2024', hires: 55 },
      { year: '2025', hires: 60 },
      { year: 'Proj 2026', hires: 70 }
    ]
  },

  {
    id: 'cognizant',
    name: 'Cognizant',
    category: 'Service / Mass',
    difficulty: 'Medium',
    theme: 'from-green-500 to-emerald-600',
    border: 'border-green-200',
    bg: 'bg-green-50/50',
    iconBg: 'bg-green-100',
    badge: 'Consistent Recruiter',
    skills: [
      { name: 'Java / Python', match: 75, icon: Code2 },
      { name: 'Aptitude', match: 80, icon: Cpu },
      { name: 'Web Development', match: 60, icon: Zap },
      { name: 'SQL', match: 65, icon: LineChart }
    ],
    insight: 'Cognizant focuses on consistency in aptitude + coding rounds. Strong communication skills also play a major role.',
    trends: [
      { year: '2023', hires: 55 },
      { year: '2024', hires: 50 },
      { year: '2025', hires: 60 },
      { year: 'Proj 2026', hires: 65 }
    ]
  },

  {
    id: 'ey',
    name: 'EY (Ernst & Young)',
    category: 'Consulting / Finance',
    difficulty: 'Medium',
    theme: 'from-yellow-500 to-amber-500',
    border: 'border-yellow-200',
    bg: 'bg-yellow-50/50',
    iconBg: 'bg-yellow-100',
    badge: 'Consulting Role',
    skills: [
      { name: 'Data Analytics', match: 80, icon: LineChart },
      { name: 'Excel & BI Tools', match: 75, icon: Cpu },
      { name: 'SQL', match: 65, icon: Code2 },
      { name: 'Business Understanding', match: 70, icon: Zap }
    ],
    insight: 'EY roles require a mix of technical and business understanding. Strong data interpretation and communication skills are key.',
    trends: [
      { year: '2023', hires: 40 },
      { year: '2024', hires: 45 },
      { year: '2025', hires: 50 },
      { year: 'Proj 2026', hires: 55 }
    ]
  },

  {
    id: 'ptc',
    name: 'PTC',
    category: 'Product / Engineering',
    difficulty: 'Hard',
    theme: 'from-red-500 to-pink-500',
    border: 'border-red-200',
    bg: 'bg-red-50/50',
    iconBg: 'bg-red-100',
    badge: 'High Package',
    skills: [
      { name: 'C++ / Core Programming', match: 85, icon: Code2 },
      { name: 'Data Structures', match: 90, icon: Cpu },
      { name: 'System Design Basics', match: 60, icon: Zap },
      { name: 'Problem Solving', match: 88, icon: LineChart }
    ],
    insight: 'PTC focuses on strong DSA and core programming. High-quality coding skills and deep problem-solving ability are essential.',
    trends: [
      { year: '2023', hires: 8 },
      { year: '2024', hires: 10 },
      { year: '2025', hires: 11 },
      { year: 'Proj 2026', hires: 12 }
    ]
  },

  {
    id: 'dataaxle',
    name: 'DataAxle',
    category: 'Data / Analytics',
    difficulty: 'Medium',
    theme: 'from-indigo-500 to-blue-500',
    border: 'border-indigo-200',
    bg: 'bg-indigo-50/50',
    iconBg: 'bg-indigo-100',
    badge: 'Niche Recruiter',
    skills: [
      { name: 'Data Analysis', match: 85, icon: LineChart },
      { name: 'Python', match: 70, icon: Code2 },
      { name: 'SQL', match: 75, icon: Cpu },
      { name: 'Data Cleaning', match: 65, icon: Zap }
    ],
    insight: 'DataAxle roles revolve around data processing and analytics. Strong SQL and real-world dataset handling experience is crucial.',
    trends: [
      { year: '2023', hires: 3 },
      { year: '2024', hires: 4 },
      { year: '2025', hires: 4 },
      { year: 'Proj 2026', hires: 5 }
    ]
  }
];

export const CompanyTarget = () => {
  const [selectedCompany, setSelectedCompany] = useState(COMPANIES[0]);
  const navigate = useNavigate();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      
      {/* Hero Header */}
      <div className="bg-slate-900 rounded-3xl p-8 mb-8 text-white relative overflow-hidden shadow-2xl">
        {/* Abstract Background Elements */}
        <div className="absolute top-0 right-0 -mt-20 -mr-20 w-80 h-80 bg-blue-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 -mb-20 -ml-20 w-64 h-64 bg-indigo-500 opacity-20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between">
          <div>
            <div className="inline-flex items-center space-x-2 bg-white/10 backdrop-blur-md px-3 py-1.5 rounded-full text-blue-200 text-xs font-bold tracking-wider uppercase mb-4 border border-white/10">
              <span className="w-2 h-2 rounded-full bg-blue-400 animate-pulse"></span>
              <span>Live Placement Intelligence</span>
            </div>
            <h1 className="text-4xl font-extrabold mb-2 tracking-tight">Placement Target Radar</h1>
            <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
              Analyze company-specific hiring algorithms, required tech stacks, and simulated readiness scores to strategically position your portfolio for upcoming drives.
            </p>
          </div>
          
          {/* Global Stats Snippet */}
          <div className="mt-6 md:mt-0 flex space-x-4">
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center min-w-[120px]">
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">{COMPANIES.length}</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Tracked Orgs</p>
            </div>
            <div className="bg-white/5 backdrop-blur-md border border-white/10 p-4 rounded-2xl text-center min-w-[120px]">
              <p className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">92%</p>
              <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mt-1">Data Accuracy</p>
            </div>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Sidebar: Company List */}
        <div className="space-y-4">
          <h2 className="text-lg font-bold text-slate-900 mb-4 px-1">Target Companies</h2>
          {COMPANIES.map((company) => (
            <div 
              key={company.id}
              onClick={() => setSelectedCompany(company)}
              className={`group p-4 rounded-2xl cursor-pointer transition-all duration-300 border-2 ${
                selectedCompany.id === company.id 
                  ? `${company.border} ${company.bg} shadow-md transform scale-[1.02]` 
                  : 'border-transparent bg-white shadow-sm hover:border-slate-200 hover:shadow-md'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${company.theme} flex items-center justify-center text-white font-black text-xl shadow-lg transition-transform group-hover:rotate-3`}>
                    {company.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className={`font-bold transition-colors ${selectedCompany.id === company.id ? 'text-slate-900' : 'text-slate-700'}`}>
                      {company.name}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">{company.category}</p>
                  </div>
                </div>
                <ChevronRight className={`w-5 h-5 transition-transform duration-300 ${
                  selectedCompany.id === company.id ? 'text-slate-900 translate-x-1' : 'text-slate-300 group-hover:text-slate-500'
                }`} />
              </div>
            </div>
          ))}
        </div>

        {/* Right Section: Company Details */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Main Info Card */}
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-8 relative overflow-hidden transition-all duration-500">
            {/* Top decorative gradient bar */}
            <div className={`absolute top-0 left-0 w-full h-2 bg-gradient-to-r ${selectedCompany.theme}`}></div>
            
            <div className="flex flex-col sm:flex-row justify-between items-start mb-6 gap-4">
              <div>
                <div className="flex items-center space-x-3 mb-2">
                  <h2 className="text-3xl font-extrabold text-slate-900">{selectedCompany.name}</h2>
                  {selectedCompany.badge && (
                    <span className={`px-3 py-1 rounded-full text-xs font-bold border ${selectedCompany.border} ${selectedCompany.bg} text-slate-700 whitespace-nowrap`}>
                      ★ {selectedCompany.badge}
                    </span>
                  )}
                </div>
                <p className="text-sm font-bold text-slate-500 uppercase tracking-widest">{selectedCompany.category}</p>
              </div>
              
              <div className="text-left sm:text-right bg-slate-50 border border-slate-100 px-4 py-2 rounded-xl">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider mb-1">Interview Difficulty</p>
                <div className="flex items-center sm:justify-end space-x-1.5">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    selectedCompany.difficulty === 'Hard' ? 'bg-red-500' : 
                    selectedCompany.difficulty === 'Medium' ? 'bg-amber-500' : 'bg-emerald-500'
                  }`}></span>
                  <span className="font-bold text-slate-700">{selectedCompany.difficulty}</span>
                </div>
              </div>
            </div>

            <div className={`p-5 rounded-2xl border ${selectedCompany.border} ${selectedCompany.bg} flex items-start space-x-4`}>
              <div className={`p-2 rounded-xl ${selectedCompany.iconBg} shrink-0`}>
                <Target className={`w-6 h-6 text-slate-800`} />
              </div>
              <p className="text-sm text-slate-800 font-medium leading-relaxed">
                <strong className="block mb-1">Insider Intel:</strong>
                {selectedCompany.insight}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Required Skills & Readiness Card */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-bold text-slate-900 flex items-center">
                  <Award className="w-5 h-5 mr-2 text-slate-400" />
                  Skill Readiness Match
                </h3>
              </div>
              
              <div className="space-y-5 flex-1">
                {selectedCompany.skills.map((skill, idx) => (
                  <div key={idx} className="group relative">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center space-x-2">
                        <skill.icon className="w-4 h-4 text-slate-400" />
                        <span className="font-bold text-slate-700 text-sm">{skill.name}</span>
                      </div>
                      <span className="text-xs font-bold text-slate-500">{skill.match}% Match</span>
                    </div>
                    {/* Progress Bar Track */}
                    <div className="w-full bg-slate-100 rounded-full h-2.5 overflow-hidden flex">
                      {/* Animated Progress Fill */}
                      <div 
                        className={`h-2.5 rounded-full bg-gradient-to-r ${selectedCompany.theme} transition-all duration-1000 ease-out`} 
                        style={{ width: `${skill.match}%` }}
                      ></div>
                    </div>
                    
                    {/* Hover Action to jump to market */}
                    <div className="absolute right-0 top-0 -mt-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={() => navigate('/')}
                        className="flex items-center bg-slate-900 hover:bg-slate-800 text-white text-[10px] font-bold px-2 py-1 rounded shadow-lg transform translate-x-2 group-hover:translate-x-0 transition-all"
                      >
                        Trade <ArrowUpRight className="w-3 h-3 ml-1" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              
              <button 
                onClick={() => navigate('/')}
                className="w-full mt-6 py-3 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 font-bold text-sm transition-colors flex items-center justify-center"
              >
                Acquire Missing Skills <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>

            {/* Hiring Trends Chart */}
            <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-full">
              <h3 className="text-lg font-bold text-slate-900 mb-6 flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-slate-400" />
                Historical Hiring Volume
              </h3>
              
              <div className="flex-1 min-h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={selectedCompany.trends}>
                    <defs>
                      <linearGradient id="colorHires" x1="0" y1="0" x2="0" y2="1">
                        {/* Dynamically match the chart to the company theme colors */}
                        <stop offset="5%" stopColor={selectedCompany.difficulty === 'Hard' ? '#f59e0b' : '#3b82f6'} stopOpacity={0.4}/>
                        <stop offset="95%" stopColor={selectedCompany.difficulty === 'Hard' ? '#f59e0b' : '#3b82f6'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis 
                      dataKey="year" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{fontSize: 12, fill: '#94a3b8', fontWeight: 600}} 
                      dy={10}
                    />
                    <YAxis hide domain={['dataMin - 1000', 'dataMax + 1000']} />
                    <Tooltip 
                      cursor={{ stroke: '#cbd5e1', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{ borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                      labelStyle={{ color: '#64748b', fontWeight: 'bold', marginBottom: '4px' }}
                      formatter={(value: number) => [<span className="font-bold text-slate-900">{value.toLocaleString()}</span>, 'Projected Hires']}
                    />
                    <Area 
                      type="monotone" 
                      dataKey="hires" 
                      stroke={selectedCompany.difficulty === 'Hard' ? '#f59e0b' : '#3b82f6'} 
                      strokeWidth={4} 
                      fillOpacity={1} 
                      fill="url(#colorHires)" 
                      animationDuration={1500}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>
            
          </div>
        </div>
      </div>
    </div>
  );
};