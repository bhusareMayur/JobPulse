import { useState, useEffect } from 'react';
import { User, Share2, Copy, Check, LogOut, Wallet, Calendar } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

export const Profile = () => {
  const { user, profile, signOut } = useAuth();
  const [copied, setCopied] = useState(false);
  const [totalWealth, setTotalWealth] = useState<number>(0);
  const [loadingWealth, setLoadingWealth] = useState(true);

  // Fetch holdings to calculate Total Wealth (Cash + Assets)
  useEffect(() => {
    if (user && profile) {
      calculateWealth();
    }
  }, [user, profile]);

  const calculateWealth = async () => {
    try {
      const { data: holdings } = await supabase
        .from('holdings')
        .select('quantity, skills(current_price)')
        .eq('user_id', user?.id);

      let portfolioValue = 0;
      if (holdings) {
        holdings.forEach((h: any) => {
          portfolioValue += h.quantity * (h.skills?.current_price || 0);
        });
      }
      setTotalWealth((profile?.balance || 0) + portfolioValue);
    } catch (error) {
      console.error('Error calculating portfolio score:', error);
    } finally {
      setLoadingWealth(false);
    }
  };

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // WhatsApp Sharing Function
  const handleWhatsAppShare = () => {
    if (!profile?.referral_code) return;
    
    // Create the message with a slogan, code, and steps using educational language
    const message = `🚀 Track in-demand career skills on the JobPulse Simulator!\n\nSign up using my invite code and get an instant 500 JC bonus after your first simulation.\n\n🔑 My Invite Code: *${profile.referral_code}*\n\nHow to claim:\n1️⃣ Go to https://job-pulse-pi.vercel.app/\n2️⃣ Sign up and enter my code\n3️⃣ Complete your first simulation\n4️⃣ Get 500 JC (JobCoins) instantly! 🎓`;
    
    // URL-encode the text to safely pass it to WhatsApp
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    
    // Open WhatsApp in a new tab (works for both web and mobile)
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        
        {/* Left Column: Account Information */}
        <div className="flex flex-col space-y-6">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
            {/* Header Section */}
            <div className="p-6 border-b border-gray-100 flex items-center space-x-4 bg-gray-50/50">
              <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0 shadow-inner">
                <User className="w-8 h-8 text-blue-600" />
              </div>
              <div className="min-w-0">
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {user?.email}
                </h2>
                <p className="text-sm text-gray-500 flex items-center mt-1">
                  <Calendar className="w-4 h-4 mr-1" /> 
                  Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }) : 'Recently'}
                </p>
              </div>
            </div>

            {/* Body Section */}
            <div className="p-6 space-y-6">
              {/* Wealth Stats Grid */}
              <div className="grid grid-cols-2 gap-4">
                <div className="bg-gray-50 p-4 rounded-xl border border-gray-100">
                  <p className="text-sm text-gray-500 mb-1 font-medium">Available Credits</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {profile?.balance.toFixed(2)} JC
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-700 mb-1 font-medium flex items-center">
                    <Wallet className="w-4 h-4 mr-1" /> Total Portfolio Score
                  </p>
                  {loadingWealth ? (
                    <div className="h-8 w-24 bg-blue-200 rounded animate-pulse"></div>
                  ) : (
                    <p className="text-2xl font-bold text-blue-700">
                      {totalWealth.toFixed(2)} JC
                    </p>
                  )}
                </div>
              </div>

              {/* User ID */}
              <div>
                <label className="block text-sm font-medium text-gray-600 mb-2">
                  System User ID
                </label>
                <div className="bg-gray-50 p-3 rounded-lg border border-gray-100">
                  <p className="text-gray-600 font-mono text-sm break-all">
                    {user?.id}
                  </p>
                </div>
              </div>

              {/* Logout Button */}
              <button
                onClick={() => signOut()}
                className="w-full flex items-center justify-center space-x-2 py-3 px-4 bg-white border-2 border-red-100 text-red-600 rounded-xl hover:bg-red-50 hover:border-red-200 transition-all font-bold mt-4"
              >
                <LogOut className="w-5 h-5" />
                <span>Log Out securely</span>
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Referral Program (Glassmorphism UI) */}
        <div className="flex flex-col h-full">
          <div className="bg-gradient-to-br from-blue-600 to-indigo-800 rounded-2xl shadow-lg p-8 text-white flex-1 relative overflow-hidden">
            {/* Background Decoration */}
            <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 bg-white opacity-10 rounded-full blur-2xl"></div>
            
            <div className="relative z-10">
              <div className="flex items-center space-x-3 mb-8">
                <Share2 className="w-8 h-8 text-blue-200" />
                <h2 className="text-2xl font-bold">Invite Fellow Analysts</h2>
              </div>

              {/* Code Copier & WhatsApp Share */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 mb-6">
                <p className="text-blue-100 text-sm font-medium mb-3 uppercase tracking-wider">Your Unique Invite Code</p>
                
                <div className="flex items-center justify-between bg-black/20 rounded-lg p-2 pl-4 mb-4">
                  <span className="text-3xl font-bold tracking-widest font-mono text-white">
                    {profile?.referral_code}
                  </span>
                  <button
                    onClick={copyReferralCode}
                    className="bg-blue-500 hover:bg-blue-400 text-white rounded-lg p-3 transition-colors shadow-sm"
                    title="Copy code"
                  >
                    {copied ? (
                      <Check className="w-5 h-5" />
                    ) : (
                      <Copy className="w-5 h-5" />
                    )}
                  </button>
                </div>

                {/* WhatsApp Share Button */}
                <button
                  onClick={handleWhatsAppShare}
                  className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center space-x-2 transition-colors shadow-sm"
                >
                  <svg 
                    xmlns="http://www.w3.org/2000/svg" 
                    width="24" 
                    height="24" 
                    viewBox="0 0 24 24" 
                    fill="white"
                    className="w-6 h-6"
                  >
                    <path d="M12.031 0C5.385 0 0 5.385 0 12.031c0 2.12.553 4.188 1.603 6.012L.15 24l6.103-1.6c1.782.96 3.79 1.464 5.778 1.464h.005C18.681 23.864 24 18.479 24 11.833 24 5.187 18.615 0 12.031 0zm0 21.864h-.003c-1.8 0-3.565-.483-5.111-1.396l-.367-.217-3.799.996 1.015-3.705-.238-.378c-.999-1.591-1.528-3.432-1.528-5.333 0-5.507 4.484-9.99 9.993-9.99 2.666 0 5.174 1.04 7.06 2.927 1.884 1.885 2.921 4.394 2.921 7.061-.002 5.51-4.488 9.995-9.995 9.995zm5.474-7.48c-.3-.15-1.774-.875-2.048-.975-.274-.1-.474-.15-.674.15-.2.3-.774.975-.949 1.175-.175.2-.35.225-.65.075-.3-.15-1.265-.466-2.408-1.488-.888-.795-1.488-1.776-1.663-2.076-.175-.3-.019-.462.131-.612.135-.135.3-.35.45-.525.15-.175.2-.3.3-.5.1-.2.05-.375-.025-.525-.075-.15-.674-1.625-.924-2.225-.243-.585-.49-.505-.674-.515-.175-.008-.375-.008-.575-.008-.2 0-.525.075-.8.375-.275.3-1.049 1.025-1.049 2.5 0 1.475 1.074 2.9 1.224 3.1.15.2 2.115 3.226 5.124 4.526.716.31 1.274.495 1.709.633.718.228 1.37.195 1.886.118.58-.086 1.774-.725 2.024-1.425.25-.7.25-1.3.175-1.425-.075-.125-.275-.2-.575-.35z"/>
                  </svg>
                  <span>Share via WhatsApp</span>
                </button>
              </div>

              {/* How it works & Rewards */}
              <div className="space-y-4">
                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5">
                  <h3 className="font-bold text-lg mb-3 flex items-center">
                    <span className="bg-blue-500 rounded-full w-6 h-6 flex items-center justify-center text-sm mr-2">?</span>
                    How it works
                  </h3>
                  <ul className="space-y-3 text-blue-50 text-sm">
                    <li className="flex items-start space-x-3">
                      <span className="font-bold text-blue-300 mt-0.5">1.</span>
                      <span>Share your code with peers to join JobPulse.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="font-bold text-blue-300 mt-0.5">2.</span>
                      <span>They sign up using your invite code.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="font-bold text-blue-300 mt-0.5">3.</span>
                      <span>After their first simulation, you both receive bonus JC!</span>
                    </li>
                  </ul>
                </div>

                <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5">
                  <h3 className="font-bold mb-4 text-center text-blue-100 uppercase tracking-widest text-sm">Instant Rewards</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center bg-black/20 rounded-lg p-3">
                      <p className="text-2xl font-bold text-green-400">1000 JC</p>
                      <p className="text-xs text-blue-200 mt-1 uppercase font-medium">For You</p>
                    </div>
                    <div className="text-center bg-black/20 rounded-lg p-3">
                      <p className="text-2xl font-bold text-blue-300">500 JC</p>
                      <p className="text-xs text-blue-200 mt-1 uppercase font-medium">For Peer</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referred By Status */}
              {profile?.referred_by && (
                <div className="mt-6 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">Invited By</p>
                    <p className="font-bold text-white font-mono">{profile.referred_by}</p>
                  </div>
                  {profile.referral_rewarded && (
                    <span className="flex items-center space-x-1 text-xs font-bold text-green-400 bg-green-400/10 px-3 py-1.5 rounded-full">
                      <Check className="w-3 h-3" />
                      <span>Bonus Claimed</span>
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Footer Note */}
      <div className="mt-8 bg-amber-50 border border-amber-200 rounded-xl p-5 flex items-start space-x-3">
        <div className="text-amber-500 font-bold text-xl mt-0.5">!</div>
        <div>
          <h3 className="font-bold text-amber-900 mb-1">Important Note</h3>
          <p className="text-sm text-amber-800 leading-relaxed">
            Invite rewards are automatically credited to your portfolio immediately after the referred user successfully completes their first simulation on the platform. Both you and your peer will receive the bonus JC instantly!
          </p>
        </div>
      </div>
    </div>
  );
};