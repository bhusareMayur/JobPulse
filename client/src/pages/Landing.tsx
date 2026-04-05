// client/src/pages/Landing.tsx
import { Link, Navigate } from 'react-router-dom';
import { TrendingUp, Briefcase, Award, ArrowRight, LineChart } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext'; 

export default function Landing() {
  const { user } = useAuth();

  // If the user is already logged in, redirect them straight to the platform
  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* Navigation Bar for Landing Page */}
      <nav className="container mx-auto px-6 py-4 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <TrendingUp className="h-8 w-8 text-blue-600" />
          <span className="text-2xl font-bold tracking-tight">JobPulse</span>
        </div>
        <div className="space-x-4">
          <Link to="/login" className="text-slate-600 hover:text-slate-900 font-medium">
            Log in
          </Link>
          <Link 
            to="/signup" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-lg font-medium transition-colors"
          >
            Sign up
          </Link>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="container mx-auto px-6 pt-20 pb-32 text-center">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-100 text-blue-700 text-sm font-semibold mb-8">
          <span className="flex h-2 w-2 rounded-full bg-blue-600"></span>
          Live Real-World Market Data
        </div>
        
        <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight mb-8">
          Invest in the <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">Future of Work</span>
        </h1>
        
        <p className="text-xl text-slate-600 mb-12 max-w-2xl mx-auto leading-relaxed">
          JobPulse is the first virtual trading platform where you can invest in professional skills like stocks. Trade "React Developer" or "AI Engineer" based on real-world job demand.
        </p>

        <div className="flex flex-col sm:flex-row justify-center gap-4">
          <Link 
            to="/signup" 
            className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 rounded-xl font-bold text-lg flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-200"
          >
            Start Trading Now <ArrowRight className="h-5 w-5" />
          </Link>
        </div>

        {/* Feature Highlights Grid */}
        <div className="grid md:grid-cols-3 gap-8 mt-32 text-left">
          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-blue-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <LineChart className="h-7 w-7 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Dynamic Pricing</h3>
            <p className="text-slate-600">Prices fluctuate up to ±5% daily based on actual job postings from the real-world market.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-indigo-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Briefcase className="h-7 w-7 text-indigo-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Build Your Portfolio</h3>
            <p className="text-slate-600">Start with 10,000 JobCoins. Buy low, sell high, and build a diverse portfolio of high-demand skills.</p>
          </div>

          <div className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100">
            <div className="bg-emerald-100 w-14 h-14 rounded-xl flex items-center justify-center mb-6">
              <Award className="h-7 w-7 text-emerald-600" />
            </div>
            <h3 className="text-xl font-bold mb-3">Compete Globally</h3>
            <p className="text-slate-600">Climb the leaderboard by generating the most profit. Prove you know where the tech industry is heading.</p>
          </div>
        </div>
      </main>
    </div>
  );
}