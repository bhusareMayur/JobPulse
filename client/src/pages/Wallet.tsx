import { useEffect, useState } from 'react';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, History, ChevronDown } from 'lucide-react';
import { supabase, Holding, Trade } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface HoldingWithSkill extends Holding {
  skill_name: string;
  current_price: number;
}

interface WalletProps {
  onNavigateToSkill: (skillId: string) => void;
}

export const Wallet = ({ onNavigateToSkill }: WalletProps) => {
  const { profile, user } = useAuth();
  const [holdings, setHoldings] = useState<HoldingWithSkill[]>([]);
  const [trades, setTrades] = useState<(Trade & { skill_name: string })[]>([]);
  const [rewards, setRewards] = useState<any[]>([]); // New state for referral rewards
  const [loading, setLoading] = useState(true);
  
  const [tradeLimit, setTradeLimit] = useState(10);
  const [hasMoreTrades, setHasMoreTrades] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;

    // Fetch holdings, trades, and referral rewards simultaneously
    const [holdingsRes, tradesRes, rewardsRes] = await Promise.all([
      supabase
        .from('holdings')
        .select('*, skills(name, current_price)')
        .eq('user_id', user.id),
      supabase
        .from('trades')
        .select('*, skills(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10),
      supabase
        .from('referral_rewards')
        .select('*')
        .or(`referrer_id.eq.${user.id},referee_id.eq.${user.id}`)
        .order('paid_at', { ascending: false })
    ]);

    if (holdingsRes.data) {
      const holdingsWithSkill = holdingsRes.data.map((h: any) => ({
        ...h,
        skill_name: h.skills.name,
        current_price: h.skills.current_price,
      }));
      setHoldings(holdingsWithSkill);
    }

    if (tradesRes.data) {
      const tradesWithSkill = tradesRes.data.map((t: any) => ({
        ...t,
        skill_name: t.skills.name,
      }));
      setTrades(tradesWithSkill);
      setHasMoreTrades(tradesRes.data.length === 10);
    }

    if (rewardsRes.data) {
      setRewards(rewardsRes.data);
    }

    setLoading(false);
  };

  const loadMoreTrades = async () => {
    if (!user) return;
    setLoadingMore(true);
    
    const newLimit = tradeLimit + 10;
    
    const { data, error } = await supabase
      .from('trades')
      .select('*, skills(name)')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .limit(newLimit);

    if (!error && data) {
      const tradesWithSkill = data.map((t: any) => ({
        ...t,
        skill_name: t.skills.name,
      }));
      setTrades(tradesWithSkill);
      setTradeLimit(newLimit);
      setHasMoreTrades(data.length === newLimit);
    }
    
    setLoadingMore(false);
  };

  // Combine trades and rewards into a single timeline array
  const getUnifiedTransactions = () => {
    const formattedTrades = trades.map(t => ({
      id: t.id,
      type: t.type,
      title: t.skill_name,
      amount: t.total_value,
      date: t.created_at,
      details: `${t.quantity} × ${t.price.toFixed(2)} JC`,
      skill_id: t.skill_id
    }));

    const formattedRewards = rewards.map(r => {
      const isReferrer = r.referrer_id === user?.id;
      return {
        id: r.id,
        type: 'referral',
        title: isReferrer ? 'Referral Reward' : 'Welcome Bonus',
        amount: isReferrer ? r.referrer_amount : r.referee_amount,
        date: r.paid_at,
        details: isReferrer ? 'You referred a new trader' : 'Referred by a friend',
        skill_id: null
      };
    });

    return [...formattedTrades, ...formattedRewards]
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, tradeLimit); // Apply pagination to the combined list
  };

  const calculatePortfolioValue = () => {
    return holdings.reduce((sum, h) => sum + h.current_price * h.quantity, 0);
  };

  const calculateTotalPL = () => {
    const invested = holdings.reduce((sum, h) => sum + h.average_buy_price * h.quantity, 0);
    const current = calculatePortfolioValue();
    return current - invested;
  };

  const calculateTotalWealth = () => {
    return (profile?.balance || 0) + calculatePortfolioValue();
  };

  const calculateOverallPL = () => {
    return calculateTotalWealth() - 10000;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const portfolioValue = calculatePortfolioValue();
  const portfolioPL = calculateTotalPL();
  const totalWealth = calculateTotalWealth();
  const overallPL = calculateOverallPL();
  const overallPLPercent = (overallPL / 10000) * 100;
  const transactions = getUnifiedTransactions();

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold text-gray-900 mb-8">My Wallet</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-2">
            <WalletIcon className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">Cash Balance</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{profile?.balance.toFixed(2)} JC</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-2">
            <TrendingUp className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">Portfolio Value</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{portfolioValue.toFixed(2)} JC</p>
          <p className={`text-sm ${portfolioPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {portfolioPL >= 0 ? '+' : ''}{portfolioPL.toFixed(2)} JC
          </p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-2">
            <WalletIcon className="w-5 h-5 text-gray-600" />
            <span className="text-sm text-gray-600">Total Wealth</span>
          </div>
          <p className="text-2xl font-bold text-gray-900">{totalWealth.toFixed(2)} JC</p>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-2">
            {overallPL >= 0 ? (
              <TrendingUp className="w-5 h-5 text-green-600" />
            ) : (
              <TrendingDown className="w-5 h-5 text-red-600" />
            )}
            <span className="text-sm text-gray-600">Overall P&L</span>
          </div>
          <p className={`text-2xl font-bold ${overallPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {overallPL >= 0 ? '+' : ''}{overallPL.toFixed(2)} JC
          </p>
          <p className={`text-sm ${overallPL >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            {overallPL >= 0 ? '+' : ''}{overallPLPercent.toFixed(2)}%
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">My Holdings</h2>
          {holdings.length > 0 ? (
            <div className="space-y-3">
              {holdings.map((holding) => {
                const invested = holding.average_buy_price * holding.quantity;
                const current = holding.current_price * holding.quantity;
                const pl = current - invested;
                const plPercent = (pl / invested) * 100;

                return (
                  <div 
                    key={holding.skill_id} 
                    onClick={() => onNavigateToSkill(holding.skill_id)}
                    className="border border-gray-200 rounded-lg p-4 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                  >
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-bold text-gray-900">{holding.skill_name}</h3>
                      <div className="text-right">
                        <p className="font-bold text-gray-900">{current.toFixed(2)} JC</p>
                        <p className={`text-sm ${pl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {pl >= 0 ? '+' : ''}{pl.toFixed(2)} ({pl >= 0 ? '+' : ''}{plPercent.toFixed(2)}%)
                        </p>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-sm">
                      <div>
                        <p className="text-gray-600">Quantity</p>
                        <p className="font-medium text-gray-900">{holding.quantity}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Avg Price</p>
                        <p className="font-medium text-gray-900">{holding.average_buy_price.toFixed(2)}</p>
                      </div>
                      <div>
                        <p className="text-gray-600">Current</p>
                        <p className="font-medium text-gray-900">{holding.current_price.toFixed(2)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No holdings yet</p>
              <p className="text-sm">Start trading to build your portfolio</p>
            </div>
          )}
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <div className="flex items-center space-x-2 mb-4">
            <History className="w-5 h-5 text-gray-600" />
            <h2 className="text-xl font-bold text-gray-900">Transaction History</h2>
          </div>
          {transactions.length > 0 ? (
            <div className="space-y-2">
              {transactions.map((tx) => (
                <div 
                  key={tx.id} 
                  onClick={() => tx.skill_id && onNavigateToSkill(tx.skill_id)}
                  className={`border border-gray-200 rounded-lg p-3 transition-colors ${
                    tx.skill_id 
                      ? 'cursor-pointer hover:border-blue-400 hover:bg-blue-50' 
                      : 'bg-yellow-50/50'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="font-medium text-gray-900">{tx.title}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(tx.date).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        tx.type === 'buy'
                          ? 'bg-green-100 text-green-700'
                          : tx.type === 'sell'
                          ? 'bg-red-100 text-red-700'
                          : 'bg-yellow-100 text-yellow-700'
                      }`}
                    >
                      {tx.type === 'referral' ? 'BONUS' : tx.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm items-center">
                    <span className="text-gray-600">
                      {tx.details}
                    </span>
                    <span className={`font-bold ${tx.type === 'buy' ? 'text-gray-900' : 'text-green-600'}`}>
                      {tx.type === 'buy' ? '-' : '+'}{tx.amount.toFixed(2)} JC
                    </span>
                  </div>
                </div>
              ))}
              
              {/* Load More Button */}
              {hasMoreTrades && (
                <button
                  onClick={loadMoreTrades}
                  disabled={loadingMore}
                  className="w-full mt-4 py-3 bg-gray-50 hover:bg-blue-50 text-blue-600 font-medium rounded-lg border border-transparent hover:border-blue-200 transition-colors flex items-center justify-center space-x-2 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loadingMore ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
                  ) : (
                    <>
                      <span>Load More History</span>
                      <ChevronDown className="w-4 h-4" />
                    </>
                  )}
                </button>
              )}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No transactions yet</p>
              <p className="text-sm">Your activity will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};