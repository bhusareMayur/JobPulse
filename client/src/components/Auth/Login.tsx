import { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { TrendingUp, graduationCap } from 'lucide-react'; // Added icons for branding

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
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl p-8 w-full max-w-md border border-slate-100">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="bg-blue-600 p-3 rounded-xl shadow-lg shadow-blue-200">
              <TrendingUp className="h-8 w-8 text-white" />
            </div>
          </div>
          <h1 className="text-3xl font-bold text-slate-900 mb-2">JobPulse</h1>
          <p className="text-slate-600 font-medium italic">Career Intelligence Simulator</p>
        </div>

        <div className="bg-indigo-50 rounded-xl p-4 mb-6 border border-indigo-100">
          <p className="text-xs text-indigo-700 text-center leading-relaxed">
            Analyze market trends, follow placement batch data, and build your industry readiness score.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Student Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              placeholder="Enter your college email"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-700 mb-1">
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-blue-500 focus:bg-white outline-none transition-all"
              placeholder="••••••••"
              required
            />
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-shake">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-slate-900 text-white py-3 rounded-xl font-bold hover:bg-slate-800 transition-all shadow-lg shadow-slate-200 disabled:opacity-50 flex items-center justify-center space-x-2"
          >
            {loading ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-white/20 border-t-white"></div>
                <span>Verifying Credentials...</span>
              </>
            ) : (
              <span>Sign In to Simulation</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-slate-100 text-center">
          <p className="text-slate-600 text-sm">
            New to the simulation lab?{' '}
            <button 
              onClick={onToggle} 
              className="text-blue-600 font-bold hover:text-blue-700 transition-colors underline underline-offset-4"
            >
              Create Account
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};