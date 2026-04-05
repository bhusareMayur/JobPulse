import { Link, Navigate } from 'react-router-dom';
import { TrendingUp, Briefcase, Award, ArrowRight, LineChart, GraduationCap, ShieldCheck } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; 

export default function Landing() {
  const { user } = useAuth();

  // If the user is already logged in, redirect them straight to the platform
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans">
      {/* Navigation Bar */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold tracking-tight text-slate-900">JobPulse</span>
        </div>
        <div className="space-x-6">
          <Link to="/login" className="text-slate-600 hover:text-blue-600 font-semibold transition-colors">
            Sign In
          </Link>
          <Link 
            to="/signup" 
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl font-bold transition-all shadow-md"
          >
            Join Simulation
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-indigo-700 text-sm font-bold mb-8">
          <GraduationCap className="h-4 w-4" />
          AI-Powered Career Intelligence Lab
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8 leading-[1.1]">
          Master the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Future of Work</span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto leading-relaxed">
          JobPulse is an <strong>educational simulation lab</strong> that helps students identify and track high-demand skills. Analyze real-world hiring data, follow placement batch trends, and bridge the gap between campus and industry.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/signup" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-xl shadow-blue-200 hover:-translate-y-1"
          >
            Launch Career Simulator <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Academic Assurance Badge */}
        <div className="mt-12 flex items-center justify-center gap-6 text-slate-400 grayscale opacity-70">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-widest">Academic Mode Enabled</span>
          </div>
          <div className="flex items-center gap-2">
            <LineChart className="h-5 w-5" />
            <span className="text-sm font-medium uppercase tracking-widest">Real-Time Industry Data</span>
          </div>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 text-left">
          {/* Feature 1 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 transition-all hover:shadow-md hover:border-blue-300 group">
            <div className="bg-blue-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <LineChart className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Market Trend Analysis</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Our AI engine scrapes global job boards to generate "Demand Scores." Understand which technologies are trending in the real market before you start your project.
            </p>
          </div>

          {/* Feature 2 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 transition-all hover:shadow-md hover:border-indigo-300 group">
            <div className="bg-indigo-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Briefcase className="h-7 w-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Placement Readiness</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Build a simulated skill portfolio with 10,000 credits. Follow the <strong>Placement Batch (2026)</strong> to see what successful seniors are learning for campus drives.
            </p>
          </div>

          {/* Feature 3 */}
          <div className="bg-white p-8 rounded-3xl shadow-sm border border-slate-200 transition-all hover:shadow-md hover:border-emerald-300 group">
            <div className="bg-emerald-100 w-14 h-14 rounded-2xl flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
              <Award className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Curated Learning</h3>
            <p className="text-slate-600 leading-relaxed text-sm">
              Don't just track—learn. Every skill comes with a verified roadmap and curated links to documentation and free video crash courses to master the tech.
            </p>
          </div>
        </div>

        {/* Institutional Benefit Section */}
        <section className="mt-32 py-16 bg-slate-900 rounded-[3rem] text-white overflow-hidden relative">
          <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
            <TrendingUp className="absolute -right-10 -bottom-10 h-64 w-64" />
          </div>
          <div className="max-w-3xl mx-auto px-6 relative z-10">
            <h2 className="text-3xl font-bold mb-6 italic">"Bridge the gap between curriculum and industry."</h2>
            <p className="text-slate-400 text-lg mb-8 leading-relaxed">
              JobPulse helps institutions understand student technical interests in real-time. By analyzing simulation data, departments can organize targeted workshops and seminars that actually match current industry needs.
            </p>
            <div className="flex items-center justify-center gap-2 text-blue-400 font-bold uppercase tracking-widest text-xs">
              Developed for Academic Excellence
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="container mx-auto px-6 py-12 border-t border-slate-200 text-center text-slate-500 text-sm">
        &copy; {new Date().getFullYear()} JobPulse Career Simulation Lab. Built for the next generation of analysts.
      </footer>
    </div>
  );
}