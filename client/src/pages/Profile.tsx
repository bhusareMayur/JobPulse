import { useState } from 'react';
import { User, Share2, Copy, Check } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

export const Profile = () => {
  const { user, profile } = useAuth();
  const [copied, setCopied] = useState(false);

  const copyReferralCode = () => {
    if (profile?.referral_code) {
      navigator.clipboard.writeText(profile.referral_code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">Profile</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-3 mb-6">
            <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center">
              <User className="w-8 h-8 text-blue-600" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-gray-900">Account Info</h2>
              <p className="text-sm text-gray-600">Your profile details</p>
            </div>
          </div>

          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Email
              </label>
              <p className="text-gray-900 font-medium">{user?.email}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                User ID
              </label>
              <p className="text-gray-900 font-mono text-sm break-all">{user?.id}</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Member Since
              </label>
              <p className="text-gray-900 font-medium">
                {profile?.created_at && new Date(profile.created_at).toLocaleDateString()}
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-600 mb-1">
                Current Balance
              </label>
              <p className="text-2xl font-bold text-green-600">
                {profile?.balance.toFixed(2)} JC
              </p>
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg shadow-sm p-6 text-white">
          <div className="flex items-center space-x-3 mb-6">
            <Share2 className="w-6 h-6" />
            <h2 className="text-xl font-bold">Referral Program</h2>
          </div>

          <div className="bg-white/10 backdrop-blur rounded-lg p-4 mb-4">
            <p className="text-sm mb-2">Your Referral Code</p>
            <div className="flex items-center justify-between bg-white/20 rounded-lg p-3">
              <span className="text-2xl font-bold tracking-wider">
                {profile?.referral_code}
              </span>
              <button
                onClick={copyReferralCode}
                className="bg-white/20 hover:bg-white/30 rounded-lg p-2 transition-colors"
              >
                {copied ? (
                  <Check className="w-5 h-5" />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-bold mb-2">How it works</h3>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start space-x-2">
                  <span className="font-bold mt-0.5">1.</span>
                  <span>Share your referral code with friends</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold mt-0.5">2.</span>
                  <span>They sign up using your code</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="font-bold mt-0.5">3.</span>
                  <span>After their first trade, you get 1000 JC and they get 500 JC!</span>
                </li>
              </ul>
            </div>

            <div className="bg-white/10 backdrop-blur rounded-lg p-4">
              <h3 className="font-bold mb-2">Rewards</h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-2xl font-bold">1000 JC</p>
                  <p className="text-xs">For You</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold">500 JC</p>
                  <p className="text-xs">For Friend</p>
                </div>
              </div>
            </div>
          </div>

          {profile?.referred_by && (
            <div className="mt-4 bg-white/10 backdrop-blur rounded-lg p-3">
              <p className="text-xs mb-1">Referred by</p>
              <p className="font-bold">{profile.referred_by}</p>
              {profile.referral_rewarded && (
                <p className="text-xs mt-2 flex items-center space-x-1">
                  <Check className="w-4 h-4" />
                  <span>Referral bonus claimed</span>
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="mt-6 bg-yellow-50 border border-yellow-200 rounded-lg p-4">
        <h3 className="font-bold text-yellow-900 mb-2">Important Note</h3>
        <p className="text-sm text-yellow-800">
          Referral rewards are automatically credited after the referred user completes their first trade.
          Both you and your friend will receive bonus JobCoins instantly!
        </p>
      </div>
    </div>
  );
};
