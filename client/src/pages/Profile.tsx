import { useState, useEffect } from 'react';
import { 
  User, Share2, LogOut, Calendar, 
  BookOpen, Target, Crown, GraduationCap, 
  Sparkles, Link as LinkIcon, Check, Pencil, Save, X
} from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const [stats, setStats] = useState({ interested: 0, learning: 0, mastered: 0, total: 0 });
  const [loadingStats, setLoadingStats] = useState(true);
  const [copied, setCopied] = useState(false);

  // Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editName, setEditName] = useState('');
  const [editBatch, setEditBatch] = useState('');
  const [editDepartment, setEditDepartment] = useState('');

  const departments = [
    'Computer Science', 'Information Technology', 'Data Science', 
    'Electronics & Telecommunication', 'Mechanical', 'Civil', 'Other'
  ];
  
  const years = ['2024', '2025', '2026', '2027', '2028', '2029'];

  // Sync profile data to local state when loaded
  useEffect(() => {
    if (profile || user) {
      setEditName(profile?.full_name || profile?.name || user?.user_metadata?.full_name || 'Student Analyst');
      setEditBatch(profile?.graduation_year?.toString() || '2026');
      setEditDepartment(profile?.department || 'Computer Science');
    }
  }, [profile, user]);

  // Fetch Readiness Stats from tracked_skills table
  useEffect(() => {
    if (user) fetchLearningStats();
  }, [user]);

  const fetchLearningStats = async () => {
    try {
      const { data, error } = await supabase
        .from('tracked_skills')
        .select('status')
        .eq('user_id', user?.id);

      if (error) throw error;

      if (data) {
        const total = data.length;
        const interested = data.filter(d => d.status === 'interested').length;
        const learning = data.filter(d => d.status === 'learning').length;
        const mastered = data.filter(d => d.status === 'mastered').length;
        
        setStats({ interested, learning, mastered, total });
      }
    } catch (error) {
      console.error('Error fetching learning stats:', error);
    } finally {
      setLoadingStats(false);
    }
  };

  // Save changes to the profiles table
  const handleSaveProfile = async () => {
    if (!user) return;
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: editName,
          graduation_year: parseInt(editBatch) || 2026,
          department: editDepartment
        })
        .eq('id', user.id);

      if (error) throw error;
      
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile", err);
      alert("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const copyPlatformLink = () => {
    navigator.clipboard.writeText('https://job-pulse-pi.vercel.app/');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleWhatsAppShare = () => {
    const message = `🚀 Hey! I'm tracking real-world job market skills and preparing for placements on JobPulse.\n\nJoin me and start building your readiness portfolio: https://job-pulse-pi.vercel.app/ 🎓`;
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      
      {/* 🌟 Premium Cover Photo Header & Editor */}
      <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.06)] overflow-hidden mb-8 border border-slate-100 transition-all">
        <div className="h-40 bg-gradient-to-r from-indigo-500 via-purple-500 to-emerald-400 relative">
          <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px]"></div>
          <div className="absolute inset-0 opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-white via-transparent to-transparent bg-[length:20px_20px]"></div>
        </div>
        
        <div className="px-8 pb-8 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6 -mt-16">
            
            <div className="flex flex-col sm:flex-row items-center sm:items-end gap-5">
              <div className="w-32 h-32 bg-white rounded-full p-1.5 shadow-xl relative z-10">
                <div className="w-full h-full bg-slate-50 border border-slate-100 rounded-full flex items-center justify-center overflow-hidden">
                  <User className="w-14 h-14 text-indigo-300" />
                </div>
              </div>
              
              {/* Profile Info / Edit Mode Toggle */}
              {isEditing ? (
                <div className="text-center sm:text-left pb-2 space-y-3 animate-in fade-in zoom-in-95 duration-200 w-full sm:w-auto">
                  
                  {/* Name Input */}
                  <input
                    type="text"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="text-2xl sm:text-3xl font-black text-slate-800 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full max-w-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 transition-shadow"
                    placeholder="Full Name"
                  />
                  
                  <div className="flex flex-col sm:flex-row gap-3">
                    {/* Batch Dropdown */}
                    <select
                      value={editBatch}
                      onChange={(e) => setEditBatch(e.target.value)}
                      className="text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full sm:w-32 focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {years.map(year => (
                        <option key={year} value={year}>{year}</option>
                      ))}
                    </select>

                    {/* Department Dropdown */}
                    <select
                      value={editDepartment}
                      onChange={(e) => setEditDepartment(e.target.value)}
                      className="text-sm font-bold text-slate-600 bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 w-full max-w-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 cursor-pointer"
                    >
                      {departments.map(dept => (
                        <option key={dept} value={dept}>{dept}</option>
                      ))}
                    </select>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex justify-center sm:justify-start gap-2 mt-2">
                    <button 
                      onClick={handleSaveProfile} 
                      disabled={isSaving} 
                      className="flex items-center space-x-1.5 bg-indigo-600 text-white px-5 py-2 rounded-xl text-sm font-bold hover:bg-indigo-700 transition-colors shadow-sm"
                    >
                      {isSaving ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <Save className="w-4 h-4" />}
                      <span>Save</span>
                    </button>
                    <button 
                      onClick={() => setIsEditing(false)} 
                      disabled={isSaving} 
                      className="flex items-center space-x-1.5 bg-slate-100 text-slate-600 px-5 py-2 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors"
                    >
                      <X className="w-4 h-4" />
                      <span>Cancel</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="text-center sm:text-left pb-2">
                  <div className="flex items-center justify-center sm:justify-start gap-3 mb-2 group">
                    <h1 className="text-3xl font-black text-slate-800 tracking-tight">
                      {editName}
                    </h1>
                    <button 
                      onClick={() => setIsEditing(true)} 
                      className="p-2 text-slate-300 hover:text-indigo-600 hover:bg-indigo-50 rounded-xl transition-all opacity-100 sm:opacity-0 sm:group-hover:opacity-100" 
                      title="Edit Profile"
                    >
                      <Pencil className="w-4 h-4" />
                    </button>
                  </div>
                  <div className="flex flex-wrap justify-center sm:justify-start gap-3 text-sm font-bold text-slate-500">
                    <span className="flex items-center bg-slate-100 px-3 py-1 rounded-full text-slate-600 border border-slate-200 shadow-sm">
                      <GraduationCap className="w-4 h-4 mr-1.5 text-indigo-500" /> 
                      Class of {editBatch}
                    </span>
                    <span className="flex items-center bg-slate-100 px-3 py-1 rounded-full text-slate-600 border border-slate-200 shadow-sm">
                      <BookOpen className="w-4 h-4 mr-1.5 text-indigo-500" /> 
                      {editDepartment}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Logout Button */}
            <div className="flex justify-center sm:justify-end pb-2">
               <button
                onClick={() => signOut()}
                className="flex items-center space-x-2 py-2.5 px-6 bg-white border border-rose-200 text-rose-600 rounded-xl hover:bg-rose-50 hover:border-rose-300 transition-all font-bold shadow-sm"
              >
                <LogOut className="w-4 h-4" />
                <span>Sign Out</span>
              </button>
            </div>
            
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Column: Readiness Portfolio (Takes up 2/3 of space) */}
        <div className="lg:col-span-2 flex flex-col space-y-8">
          
          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-800 flex items-center">
                <Sparkles className="w-5 h-5 mr-2 text-indigo-500" /> 
                Placement Readiness Status
              </h2>
              <span className="bg-indigo-50 text-indigo-600 font-bold text-xs px-3 py-1 rounded-lg border border-indigo-100">
                {stats.total} Skills Tracked
              </span>
            </div>

            {loadingStats ? (
              <div className="grid grid-cols-3 gap-6 animate-pulse">
                <div className="h-32 bg-slate-100 rounded-2xl"></div>
                <div className="h-32 bg-slate-100 rounded-2xl"></div>
                <div className="h-32 bg-slate-100 rounded-2xl"></div>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
                <div className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow">
                  <div className="bg-white p-3 rounded-2xl shadow-sm mb-3">
                    <Target className="w-6 h-6 text-slate-400" />
                  </div>
                  <p className="text-3xl font-black text-slate-700">{stats.interested}</p>
                  <p className="text-xs font-bold text-slate-500 uppercase tracking-widest mt-1">Interested</p>
                </div>
                
                <div className="bg-gradient-to-b from-indigo-50 to-blue-50 p-6 rounded-3xl border border-indigo-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-indigo-200 rounded-full blur-2xl opacity-50"></div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm mb-3 relative z-10">
                    <BookOpen className="w-6 h-6 text-indigo-500" />
                  </div>
                  <p className="text-3xl font-black text-indigo-700 relative z-10">{stats.learning}</p>
                  <p className="text-xs font-bold text-indigo-500 uppercase tracking-widest mt-1 relative z-10">Learning</p>
                </div>

                <div className="bg-gradient-to-b from-emerald-50 to-teal-50 p-6 rounded-3xl border border-emerald-100 flex flex-col items-center text-center shadow-sm hover:shadow-md transition-shadow relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-emerald-200 rounded-full blur-2xl opacity-50"></div>
                  <div className="bg-white p-3 rounded-2xl shadow-sm mb-3 relative z-10">
                    <Crown className="w-6 h-6 text-emerald-500" />
                  </div>
                  <p className="text-3xl font-black text-emerald-700 relative z-10">{stats.mastered}</p>
                  <p className="text-xs font-bold text-emerald-600 uppercase tracking-widest mt-1 relative z-10">Mastered</p>
                </div>
              </div>
            )}
          </div>

          <div className="bg-white rounded-3xl shadow-[0_8px_30px_rgb(0,0,0,0.04)] border border-slate-100 p-8">
            <h2 className="text-xl font-bold text-slate-800 mb-6 flex items-center">
              <Calendar className="w-5 h-5 mr-2 text-indigo-500" /> 
              Account Details
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Registered Email</p>
                <p className="text-slate-800 font-bold">{user?.email}</p>
              </div>
              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-100">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1">Member Since</p>
                <p className="text-slate-800 font-bold">
                  {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : 'Recently Joined'}
                </p>
              </div>
            </div>
          </div>
          
        </div>

        {/* Right Column: Generic Share Tool (Takes up 1/3 space) */}
        <div className="lg:col-span-1">
          <div className="bg-gradient-to-br from-slate-800 to-slate-900 rounded-3xl shadow-xl p-8 text-white relative overflow-hidden border border-slate-700 h-full">
            
            {/* Glowing Background Effect */}
            <div className="absolute -top-10 -right-10 w-48 h-48 bg-indigo-500/30 rounded-full blur-3xl pointer-events-none"></div>
            
            <div className="relative z-10">
              <div className="bg-white/10 w-12 h-12 rounded-2xl flex items-center justify-center mb-6 border border-white/5 backdrop-blur-md">
                <Share2 className="w-6 h-6 text-indigo-300" />
              </div>
              
              <h2 className="text-2xl font-bold tracking-tight mb-3">Learning is better together.</h2>
              <p className="text-slate-300 text-sm leading-relaxed mb-8">
                Share JobPulse with your batchmates. Track market demand, build your skill portfolio, and prepare for placements as a team.
              </p>

              <div className="space-y-4">
                {/* Copy Link Button */}
                <button
                  onClick={copyPlatformLink}
                  className="w-full bg-white/10 hover:bg-white/20 border border-white/10 text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all backdrop-blur-md"
                >
                  {copied ? <Check className="w-5 h-5 text-emerald-400" /> : <LinkIcon className="w-5 h-5 text-slate-300" />}
                  <span>{copied ? 'Link Copied!' : 'Copy Platform Link'}</span>
                </button>

                {/* WhatsApp Share Button */}
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white font-bold py-4 px-4 rounded-2xl flex items-center justify-center space-x-2 transition-all shadow-lg hover:-translate-y-0.5"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="white" className="w-6 h-6">
                    <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.12.553 4.188 1.603 6.012L.15 24l6.103-1.6c1.782.96 3.79 1.464 5.778 1.464h.005C18.681 23.864 24 18.479 24 11.833 24 5.187 18.615 0 12.031 0zm0 21.864h-.003c-1.8 0-3.565-.483-5.111-1.396l-.367-.217-3.799.996 1.015-3.705-.238-.378c-.999-1.591-1.528-3.432-1.528-5.333 0-5.507 4.484-9.99 9.993-9.99 2.666 0 5.174 1.04 7.06 2.927 1.884 1.885 2.921 4.394 2.921 7.061-.002 5.51-4.488 9.995-9.995 9.995zm5.474-7.48c-.3-.15-1.774-.875-2.048-.975-.274-.1-.474-.15-.674.15-.2.3-.774.975-.949 1.175-.175.2-.35.225-.65.075-.3-.15-1.265-.466-2.408-1.488-.888-.795-1.488-1.776-1.663-2.076-.175-.3-.019-.462.131-.612.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.674-1.625-.924-2.225-.243-.585-.49-.505-.674-.515-.175-.008-.375-.008-.575-.008-.2 0-.525.075-.8.375-.275.3-1.049 1.025-1.049 2.5 0 1.475 1.074 2.9 1.224 3.1.15.2 2.115 3.226 5.124 4.526.716.31 1.274.495 1.709.633.718.228 1.37.195 1.886.118.58-.086 1.774-.725 2.024-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z"/>
                  </svg>
                  <span>Share via WhatsApp</span>
                </button>
              </div>

            </div>
          </div>
        </div>

      </div>
    </div>
  );
};