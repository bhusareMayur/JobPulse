import { useState } from 'react';
import { 
  Mail, Lock, User, ArrowRight, Loader2, 
  Building2, GraduationCap, CheckCircle
} from 'lucide-react';
import { supabase } from '../../lib/supabase';

interface SignupProps {
  onToggle: () => void;
}

export const Signup = ({ onToggle }: SignupProps) => {
  const [name, setName] = useState(''); 
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [department, setDepartment] = useState('CS'); // Default to exact code
  const [graduationYear, setGraduationYear] = useState('2026');
  
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  // Mapped exact dashboard codes to display names
  const departments = [
    { value: 'CS', label: 'Computer Science (CS)' },
    { value: 'IT', label: 'Information Technology (IT)' },
    { value: 'CSBS', label: 'CS & Business Systems (CSBS)' },
    { value: 'ENTC', label: 'Electronics (ENTC)' },
    { value: 'MECH', label: 'Mechanical' },
    { value: 'CIVIL', label: 'Civil' },
    { value: 'OTHER', label: 'Other' }
  ];
  
  const years = ['2024', '2025', '2026', '2027', '2028', '2029'];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!name.trim()) return setError('Full Name is required');
    if (password !== confirmPassword) return setError('Passwords do not match');
    if (password.length < 6) return setError('Password must be at least 6 characters');

    setLoading(true);

    try {
      // 1. Sign up the user via Supabase Auth
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name.trim(),
            department: department, 
            graduation_year: parseInt(graduationYear),
          }
        }
      });

      if (signUpError) throw signUpError;

      // 2. Ensure the Profile is populated with the educational data AND email
      if (data?.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .upsert({
            id: data.user.id,
            full_name: name.trim(),
            email: email.trim(),       // <--- NOW SAVING EMAIL TO PROFILES TABLE
            department: department,
            graduation_year: parseInt(graduationYear),
          }, { onConflict: 'id' });
          
        if (profileError) {
          console.warn('Profile sync warning:', profileError);
        }
      }

      setSuccess(true);
    } catch (err: any) {
      setError(err.message || 'An error occurred during sign up.');
    } finally {
      setLoading(false);
    }
  };

  // SUCCESS STATE UI
  if (success) {
    return (
      <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
        <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 p-10 text-center relative overflow-hidden">
          <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-50 rounded-full blur-3xl opacity-60 -z-10"></div>
          
          <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-sm border border-emerald-100">
            <CheckCircle className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tight mb-3">Account Created!</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">
            Welcome to JobPulse. Your readiness portfolio is initialized and ready to track market demands.
          </p>
          <button
            onClick={onToggle}
            className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg hover:-translate-y-0.5"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  // SIGNUP FORM UI
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] border border-slate-100 overflow-hidden relative">
        
        {/* Soft Background Glows */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full blur-3xl opacity-60 -z-10"></div>
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-blue-50 rounded-full blur-3xl opacity-60 -z-10"></div>

        <div className="p-8 sm:p-10">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mx-auto mb-5 shadow-sm border border-indigo-100">
              <GraduationCap className="w-8 h-8" />
            </div>
            <h1 className="text-3xl font-black text-slate-800 tracking-tight mb-2">Join Your Cohort</h1>
            <p className="text-slate-500 font-medium text-sm">Create your readiness portfolio to track market demand.</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-rose-50 border border-rose-100 text-rose-600 rounded-xl text-sm font-bold text-center flex items-center justify-center">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User className="h-5 w-5 text-slate-400" />
              </div>
              <input
                type="text"
                required
                placeholder="Full Name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="pl-12 pr-4 py-3.5 w-full bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
              />
            </div>

            {/* Email */}
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

            {/* Department & Year (Side by Side) */}
            <div className="flex space-x-3">
              <div className="relative w-2/3">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Building2 className="h-5 w-5 text-slate-400" />
                </div>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="pl-11 pr-4 py-3.5 w-full bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700 appearance-none"
                >
                  {departments.map(dept => <option key={dept.value} value={dept.value}>{dept.label}</option>)}
                </select>
              </div>

              <div className="relative w-1/3">
                <select
                  value={graduationYear}
                  onChange={(e) => setGraduationYear(e.target.value)}
                  className="px-4 py-3.5 w-full bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-bold text-indigo-600 appearance-none text-center"
                >
                  {years.map(year => <option key={year} value={year}>{year}</option>)}
                </select>
              </div>
            </div>

            {/* Passwords (Side by Side on Desktop, Stacked on Mobile) */}
            <div className="flex flex-col sm:flex-row space-y-4 sm:space-y-0 sm:space-x-3">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  minLength={6}
                  className="pl-11 pr-4 py-3.5 w-full bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                />
              </div>

              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                  <Lock className="h-5 w-5 text-slate-400" />
                </div>
                <input
                  type="password"
                  required
                  placeholder="Confirm"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  minLength={6}
                  className="pl-11 pr-4 py-3.5 w-full bg-slate-50/50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:bg-white outline-none transition-all font-medium text-slate-700 placeholder-slate-400"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-indigo-600 text-white font-bold py-4 rounded-xl hover:bg-indigo-700 hover:shadow-lg hover:-translate-y-0.5 transition-all flex items-center justify-center space-x-2 disabled:opacity-70 disabled:hover:translate-y-0 mt-4"
            >
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-5 h-5" />
                </>
              )}
            </button>
          </form>

          <div className="mt-8 text-center pt-6 border-t border-slate-100">
            <p className="text-slate-500 font-medium">
              Already in a cohort?{' '}
              <button 
                onClick={onToggle}
                className="text-indigo-600 font-bold hover:text-indigo-700 transition-colors"
              >
                Sign in here
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};