import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, Mail, Lock, ArrowRight, Loader2, Sparkles } from 'lucide-react';

interface LoginProps {
  onToggle: () => void;
}

export const Login = ({ onToggle }: LoginProps) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { signIn } = useAuth();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const { error } = await signIn(email, password);
    if (error) {
      // Friendly error handling for an educational context
      setError(error.message === 'Invalid login credentials' 
        ? 'Invalid email or password. Please try again.' 
        : error.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden relative">
        
        {/* Soft Background Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-60 -z-10"></div>

        <div className="p-8 sm:p-10">
          
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-indigo-100">
              <TrendingUp className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Welcome Back</h1>
            <p className="text-slate-500 font-medium text-sm">Resume your career readiness tracking.</p>
          </div>

          {/* Educational Value Prop Box */}
          <div className="bg-indigo-50/50 rounded-2xl p-4 mb-8 border border-indigo-100/50 flex items-start space-x-3 shadow-inner">
            <Sparkles className="w-5 h-5 text-indigo-500 mt-0.5 flex-shrink-0" />
            <p className="text-xs text-indigo-700 font-medium leading-relaxed">
              Analyze market trends, follow placement batch data, and build your industry readiness score.
            </p>
          </div>

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold text-center flex items-center justify-center animate-in fade-in zoom-in duration-300">
              {error}
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Email Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Mail className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="email"
                required
                placeholder="College Email Address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-12 pr-4 py-3.5 w-full bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Password Input */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="password"
                required
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="pl-12 pr-4 py-3.5 w-full bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:hover:translate-y-0 mt-4"
            >
              {loading ? (
                <div className="flex items-center space-x-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span>Verifying...</span>
                </div>
              ) : (
                <>
                  <span>Sign In to Lab</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Toggle */}
          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-slate-500 font-medium">
              New to the simulation lab?{' '}
              <button 
                onClick={onToggle}
                className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
              >
                Create Account
              </button>
            </p>
          </div>
          
        </div>
      </div>
    </div>
  );
};