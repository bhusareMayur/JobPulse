import { Link, Navigate } from 'react-router-dom';
import { 
  TrendingUp, Briefcase, Award, ArrowRight, 
  LineChart, GraduationCap, ShieldCheck, Sparkles 
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; 

export default function Landing() {
  const { user } = useAuth();

  // If the user is already logged in, redirect them straight to the platform
  if (user) {
    return <Navigate to="/" replace />; // Redirects to Dashboard
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans relative overflow-hidden">
      
      {/* Ambient Background Glows */}
      <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
      <div className="absolute top-[20%] right-[-5%] w-80 h-80 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Navigation Bar */}
      <nav className="container mx-auto px-4 sm:px-6 py-6 flex justify-between items-center relative z-10">
        <div className="flex items-center gap-2">
          <div className="bg-indigo-600 p-2 rounded-xl shadow-lg shadow-indigo-200">
            <TrendingUp className="h-6 w-6 text-white" />
          </div>
          <span className="text-2xl font-black tracking-tight text-slate-800 hidden sm:block">JobPulse</span>
        </div>
        <div className="flex items-center gap-3 sm:gap-6">
          <Link to="/login" className="text-slate-500 hover:text-indigo-600 font-bold transition-colors text-sm sm:text-base">
            Sign In
          </Link>
          <Link 
            to="/signup" 
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-lg hover:shadow-xl hover:-translate-y-0.5 text-sm sm:text-base"
          >
            Join Platform
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-20 sm:pb-32 text-center relative z-10">
        
        <div className="animate-in fade-in slide-in-from-bottom-8 duration-1000 fill-both">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-indigo-100 text-indigo-600 text-xs sm:text-sm font-bold mb-8 shadow-sm">
            <Sparkles className="h-4 w-4 text-amber-400" />
            AI-Powered Career Intelligence Lab
          </div>
          
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-black tracking-tight mb-6 leading-[1.15] text-slate-800 max-w-5xl mx-auto">
            Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 to-blue-500">Future of Work</span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed font-medium px-2">
            JobPulse is an educational simulation lab that helps students identify and track high-demand skills. Analyze real-world hiring data, follow placement batch trends, and bridge the gap between campus and industry.
          </p>

          <div className="flex flex-col sm:flex-row justify-center gap-4 px-4 sm:px-0">
            <Link 
              to="/signup" 
              className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-indigo-200 hover:-translate-y-1 w-full sm:w-auto"
            >
              Launch Simulator <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
        </div>

        {/* Academic Assurance Badges */}
        <div className="mt-16 flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-slate-400 animate-in fade-in duration-1000 delay-300 fill-both">
          <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-slate-100">
            <ShieldCheck className="h-5 w-5 text-emerald-500" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500">Academic Mode Built-In</span>
          </div>
          <div className="flex items-center gap-2 bg-white/50 px-4 py-2 rounded-xl backdrop-blur-sm border border-slate-100">
            <LineChart className="h-5 w-5 text-blue-500" />
            <span className="text-xs sm:text-sm font-bold uppercase tracking-widest text-slate-500">Live Industry Data</span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 sm:gap-8 mt-24 text-left relative z-10">
          
          {/* Feature 1 */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 group">
            <div className="bg-blue-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-blue-100 transition-all duration-300">
              <LineChart className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Market Trend Analysis</h3>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Our AI engine scrapes global job boards to generate live "Demand Scores." Understand which technologies are surging in the real market before selecting your projects.
            </p>
          </div>

          {/* Feature 2 (UPDATED to remove JobCoins!) */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 group relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-50 rounded-full blur-3xl -z-10 group-hover:bg-indigo-100 transition-colors"></div>
            <div className="bg-indigo-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-indigo-100 transition-all duration-300">
              <Briefcase className="h-7 w-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Placement Readiness</h3>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Build a personalized readiness portfolio. Track your journey from 'Interested' to 'Mastered', and follow the Senior Placement Batch to see what top students are learning.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white/80 backdrop-blur-xl p-8 rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 transition-all hover:shadow-[0_20px_40px_rgb(0,0,0,0.08)] hover:-translate-y-2 group">
            <div className="bg-emerald-50 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 group-hover:bg-emerald-100 transition-all duration-300">
              <Award className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-3 text-slate-800">Curated Learning</h3>
            <p className="text-slate-500 font-medium leading-relaxed text-sm">
              Don't just track data—learn. Every listed skill comes with an AI-verified roadmap and curated links to official documentation and free crash courses.
            </p>
          </div>
        </div>

        {/* Institutional Benefit Section */}
        <section className="mt-24 sm:mt-32 py-16 sm:py-24 bg-slate-900 rounded-[2.5rem] sm:rounded-[3rem] text-white overflow-hidden relative shadow-2xl border border-slate-800">
          {/* Internal Glows */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/20 rounded-full blur-[100px] pointer-events-none"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-blue-500/20 rounded-full blur-[100px] pointer-events-none"></div>
          
          <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none">
            <TrendingUp className="absolute -right-10 -bottom-10 h-64 w-64 sm:h-96 sm:w-96" />
          </div>

          <div className="max-w-3xl mx-auto px-6 relative z-10">
            <div className="bg-white/10 p-3 rounded-2xl inline-flex items-center justify-center mb-8 backdrop-blur-md border border-white/5">
              <GraduationCap className="h-8 w-8 text-indigo-300" />
            </div>
            <h2 className="text-3xl sm:text-4xl font-black mb-6 tracking-tight text-white">Bridge the gap between curriculum and industry.</h2>
            <p className="text-slate-300 text-base sm:text-lg mb-10 leading-relaxed font-medium">
              JobPulse helps academic institutions understand student technical interests in real-time. By analyzing platform data, departments can organize targeted workshops and seminars that perfectly match the current hiring demands of the market.
            </p>
            <div className="inline-flex items-center justify-center gap-2 bg-indigo-500/20 border border-indigo-500/30 text-indigo-300 font-bold uppercase tracking-widest text-xs px-5 py-2.5 rounded-full">
              Developed for Academic Excellence
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-10 border-t border-slate-200 text-center relative z-10 flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex items-center gap-2 opacity-50 grayscale">
          <TrendingUp className="h-5 w-5" />
          <span className="font-bold tracking-tight">JobPulse</span>
        </div>
        <p className="text-slate-400 text-sm font-medium">
          &copy; {new Date().getFullYear()} Career Intelligence Lab. Built for analysts.
        </p>
      </footer>
    </div>
  );
}