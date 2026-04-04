import { useEffect, useState } from 'react';
import { Wallet as WalletIcon, TrendingUp, TrendingDown, History } from 'lucide-react';
import { supabase, Holding, Trade } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface HoldingWithSkill extends Holding {
  skill_name: string;
  current_price: number;
}

// Added interface for Wallet props
interface WalletProps {
  onNavigateToSkill: (skillId: string) => void;
}

// Accept the onNavigateToSkill prop
export const Wallet = ({ onNavigateToSkill }: WalletProps) => {
  const { profile, user } = useAuth();
  const [holdings, setHoldings] = useState<HoldingWithSkill[]>([]);
  const [trades, setTrades] = useState<(Trade & { skill_name: string })[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchWalletData();
    }
  }, [user]);

  const fetchWalletData = async () => {
    if (!user) return;

    const [holdingsRes, tradesRes] = await Promise.all([
      supabase
        .from('holdings')
        .select('*, skills(name, current_price)')
        .eq('user_id', user.id),
      supabase
        .from('trades')
        .select('*, skills(name)')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(20),
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
    }

    setLoading(false);
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
            <h2 className="text-xl font-bold text-gray-900">Recent Trades</h2>
          </div>
          {trades.length > 0 ? (
            <div className="space-y-2">
              {trades.map((trade) => (
                <div 
                  key={trade.id} 
                  onClick={() => onNavigateToSkill(trade.skill_id)}
                  className="border border-gray-200 rounded-lg p-3 cursor-pointer hover:border-blue-400 hover:bg-blue-50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-1">
                    <div>
                      <p className="font-medium text-gray-900">{trade.skill_name}</p>
                      <p className="text-xs text-gray-500">
                        {new Date(trade.created_at).toLocaleString()}
                      </p>
                    </div>
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        trade.type === 'buy'
                          ? 'bg-green-100 text-green-700'
                          : 'bg-red-100 text-red-700'
                      }`}
                    >
                      {trade.type.toUpperCase()}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">
                      {trade.quantity} × {trade.price.toFixed(2)} JC
                    </span>
                    <span className="font-bold text-gray-900">
                      {trade.total_value.toFixed(2)} JC
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>No trades yet</p>
              <p className="text-sm">Your trade history will appear here</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};