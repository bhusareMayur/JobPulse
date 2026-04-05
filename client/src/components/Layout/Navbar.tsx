import { useState, useEffect, useRef } from 'react';
import { TrendingUp, Wallet, Trophy, User, LogOut, History, ChevronDown, Target, Map } from 'lucide-react';
import { useAuth } from '../../contexts/AuthContext';
import { NavLink, Link } from 'react-router-dom';
import { supabase } from '../../lib/supabase';

// Define the shape for our combined dropdown history
interface UnifiedTransaction {
  id: string;
  type: 'buy' | 'sell' | 'referral';
  title: string;
  amount: number;
  date: string;
  details: string;
}

export const Navbar = () => {
  const { user, profile, signOut } = useAuth();

  const [showDropdown, setShowDropdown] = useState(false);
  const [recentTransactions, setRecentTransactions] = useState<UnifiedTransaction[]>([]);
  const [loadingTrades, setLoadingTrades] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

 const navItems = [
    { path: '/', label: 'Market', icon: TrendingUp },
    { path: '/target', label: 'Company Target', icon: Target },
    { path: '/roadmap', label: 'Action Plan', icon: Map }, 
    { path: '/wallet', label: 'Skill Portfolio', icon: Wallet },
    { path: '/leaderboard', label: 'Top Analysts', icon: Trophy },
  ];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleBalanceClick = async () => {
    setShowDropdown(!showDropdown);
    
    // Fetch trades and rewards only when opening the dropdown
    if (!showDropdown && user) {
      setLoadingTrades(true);
      
      const [tradesRes, rewardsRes] = await Promise.all([
        supabase
          .from('trades')
          .select('*, skills(name)')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false })
          .limit(5),
        supabase
          .from('referral_rewards')
          .select('*')
          .or(`referrer_id.eq.${user.id},referee_id.eq.${user.id}`)
          .order('paid_at', { ascending: false })
          .limit(5)
      ]);

      // Format standard trades
      const formattedTrades: UnifiedTransaction[] = (tradesRes.data || []).map((t: any) => ({
        id: t.id,
        type: t.type,
        title: t.skills.name,
        amount: t.total_value,
        date: t.created_at,
        details: `${t.quantity} @ ${t.price.toFixed(2)} JC`
      }));

      // Format referral rewards
      const formattedRewards: UnifiedTransaction[] = (rewardsRes.data || []).map((r: any) => {
        const isReferrer = r.referrer_id === user.id;
        return {
          id: r.id,
          type: 'referral',
          title: isReferrer ? 'Referral Reward' : 'Welcome Bonus',
          amount: isReferrer ? r.referrer_amount : r.referee_amount,
          date: r.paid_at,
          details: isReferrer ? 'Referred a friend' : 'Referred by a friend'
        };
      });

      // Combine, sort by newest, and keep only the top 5 overall
      const unified = [...formattedTrades, ...formattedRewards]
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
        .slice(0, 5);

      setRecentTransactions(unified);
      setLoadingTrades(false);
    }
  };

  return (
    <nav className="bg-white border-b border-gray-200 sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4">
        <div className="flex justify-between items-center h-16">
          <Link to="/" className="flex items-center space-x-2">
            <TrendingUp className="w-8 h-8 text-blue-600" />
            <span className="text-xl font-bold text-gray-900">JobPulse</span>
          </Link>

          <div className="hidden md:flex items-center space-x-1">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                    isActive
                      ? 'bg-blue-50 text-blue-600'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`
                }
              >
                <item.icon className="w-5 h-5" />
                <span className="font-medium">{item.label}</span>
              </NavLink>
            ))}
          </div>

          <div className="flex items-center space-x-4">
            
            {/* Balance Dropdown Container */}
            <div className="relative" ref={dropdownRef}>
              <button
                onClick={handleBalanceClick}
                className="hidden md:flex items-center space-x-2 bg-green-50 hover:bg-green-100 transition-colors px-4 py-2 rounded-lg focus:outline-none"
              >
                <Wallet className="w-5 h-5 text-green-600" />
                <span className="font-bold text-green-600">
                  {profile?.balance?.toFixed(2) || '0.00'} JC
                </span>
                <ChevronDown className={`w-4 h-4 text-green-600 transition-transform ${showDropdown ? 'rotate-180' : ''}`} />
              </button>

              {/* Recent Transactions Dropdown */}
              {showDropdown && (
                <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg border border-gray-200 py-2 z-50 hidden md:block">
                  <div className="px-4 py-2 border-b border-gray-100 flex items-center space-x-2">
                    <History className="w-4 h-4 text-gray-500" />
                    <span className="font-bold text-gray-900 text-sm">Recent Simulations</span>
                  </div>
                  
                  <div className="max-h-80 overflow-y-auto">
                    {loadingTrades ? (
                      <div className="flex justify-center items-center py-6">
                        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                      </div>
                    ) : recentTransactions.length > 0 ? (
                      <div className="divide-y divide-gray-50">
                        {recentTransactions.map((tx) => (
                          <div key={tx.id} className={`px-4 py-3 transition-colors ${tx.type === 'referral' ? 'bg-yellow-50/30' : 'hover:bg-gray-50'}`}>
                            <div className="flex justify-between items-start mb-1">
                              <span className="font-medium text-sm text-gray-900">
                                {tx.title}
                              </span>
                              <span className={`text-xs font-bold px-2 py-0.5 rounded ${
                                tx.type === 'buy' ? 'bg-green-100 text-green-700' : 
                                tx.type === 'sell' ? 'bg-red-100 text-red-700' :
                                'bg-yellow-100 text-yellow-700'
                              }`}>
                                {tx.type === 'referral' ? 'BONUS' : (tx.type === 'buy' ? 'TRACK' : 'DROP')}
                              </span>
                            </div>
                            <div className="flex justify-between text-xs text-gray-500 items-center">
                              <span>{tx.details}</span>
                              <span className={`font-medium ${tx.type === 'buy' ? 'text-gray-900' : 'text-green-600'}`}>
                                {tx.type === 'buy' ? '-' : '+'}{tx.amount.toFixed(2)} JC
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="px-4 py-6 text-center text-sm text-gray-500">
                        No simulations yet.
                      </div>
                    )}
                  </div>
                  
                  <div className="px-4 py-2 border-t border-gray-100 bg-gray-50 rounded-b-lg">
                    <Link 
                      to="/wallet" 
                      onClick={() => setShowDropdown(false)}
                      className="text-xs text-blue-600 hover:text-blue-800 font-medium w-full block text-center"
                    >
                      View Full History
                    </Link>
                  </div>
                </div>
              )}
            </div>

            <button
              onClick={signOut}
              className="flex items-center space-x-2 px-4 py-2 text-gray-700 hover:bg-gray-50 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              <span className="hidden md:inline font-medium">Logout</span>
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <div className="md:hidden flex items-center justify-around border-t border-gray-200 py-2">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) =>
                `flex flex-col items-center space-y-1 px-3 py-2 rounded-lg transition-colors ${
                  isActive ? 'text-blue-600' : 'text-gray-700'
                }`
              }
            >
              <item.icon className="w-5 h-5" />
              <span className="text-xs font-medium">{item.label}</span>
            </NavLink>
          ))}
        </div>
      </div>
    </nav>
  );
};