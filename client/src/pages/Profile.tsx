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
      console.error('Error calculating wealth:', error);
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
                  <p className="text-sm text-gray-500 mb-1 font-medium">Cash Balance</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {profile?.balance.toFixed(2)} JC
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                  <p className="text-sm text-blue-700 mb-1 font-medium flex items-center">
                    <Wallet className="w-4 h-4 mr-1" /> Total Wealth
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
                <h2 className="text-2xl font-bold">Referral Program</h2>
              </div>

              {/* Code Copier */}
              <div className="bg-white/10 backdrop-blur-md border border-white/20 rounded-xl p-5 mb-6">
                <p className="text-blue-100 text-sm font-medium mb-3 uppercase tracking-wider">Your Unique Code</p>
                <div className="flex items-center justify-between bg-black/20 rounded-lg p-2 pl-4">
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
                      <span>Share your code with friends to join SkillMarket.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="font-bold text-blue-300 mt-0.5">2.</span>
                      <span>They sign up using your referral code.</span>
                    </li>
                    <li className="flex items-start space-x-3">
                      <span className="font-bold text-blue-300 mt-0.5">3.</span>
                      <span>After their first trade, you both get paid instantly!</span>
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
                      <p className="text-xs text-blue-200 mt-1 uppercase font-medium">For Friend</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Referred By Status */}
              {profile?.referred_by && (
                <div className="mt-6 bg-white/5 border border-white/10 backdrop-blur-sm rounded-xl p-4 flex items-center justify-between">
                  <div>
                    <p className="text-xs text-blue-200 uppercase tracking-wider mb-1">Referred By</p>
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
            Referral rewards are automatically credited to your wallet immediately after the referred user successfully completes their first trade on the platform. Both you and your friend will receive the bonus JobCoins instantly!
          </p>
        </div>
      </div>
    </div>
  );
};