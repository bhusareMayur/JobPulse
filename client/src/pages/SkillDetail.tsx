import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown, Briefcase } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { supabase, Skill, PriceHistory } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useMutation, useQueryClient } from '@tanstack/react-query';

type Timeframe = '1H' | '1D' | '1W' | 'ALL';

interface SkillDetailProps {
  skillId: string;
  onBack: () => void;
}

// Extending the Skill interface locally to include the new external data fields
// (You should also add these to client/src/lib/supabase.ts)
interface ExtendedSkill extends Skill {
  current_job_listings?: number;
  external_demand_score?: number;
}

export const SkillDetail = ({ skillId, onBack }: SkillDetailProps) => {
  const [skill, setSkill] = useState<ExtendedSkill | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [timeframe, setTimeframe] = useState<Timeframe>('ALL');
  
  const [quantity, setQuantity] = useState(1);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [successMsg, setSuccessMsg] = useState('');
  
  const { profile, refreshProfile } = useAuth();
  const queryClient = useQueryClient();

  // Keep WebSockets for real-time chart updates
  useEffect(() => {
    fetchSkillData();
    
    const skillChannel = supabase
      .channel(`skill-${skillId}`)
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'skills', filter: `id=eq.${skillId}` }, (payload) => {
        setSkill(payload.new as ExtendedSkill);
      })
      .subscribe();

    const historyChannel = supabase
      .channel(`history-${skillId}`)
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'price_history', filter: `skill_id=eq.${skillId}` }, (payload) => {
        setPriceHistory(prev => {
          const newHistory = [...prev, payload.new as PriceHistory];
          return newHistory.length > 500 ? newHistory.slice(-500) : newHistory; 
        });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(skillChannel);
      supabase.removeChannel(historyChannel);
    };
  }, [skillId, timeframe]);

  const fetchSkillData = async () => {
    let historyQuery = supabase
      .from('price_history')
      .select('*')
      .eq('skill_id', skillId)
      .order('created_at', { ascending: true });

    if (timeframe !== 'ALL') {
      const now = new Date();
      let pastDate = new Date();
      if (timeframe === '1H') pastDate.setHours(now.getHours() - 1);
      if (timeframe === '1D') pastDate.setDate(now.getDate() - 1);
      if (timeframe === '1W') pastDate.setDate(now.getDate() - 7);
      
      historyQuery = historyQuery.gte('created_at', pastDate.toISOString());
    } else {
      historyQuery = historyQuery.limit(500); 
    }

    const [skillRes, historyRes] = await Promise.all([
      supabase.from('skills').select('*').eq('id', skillId).single(),
      historyQuery,
    ]);

    if (skillRes.data) setSkill(skillRes.data as ExtendedSkill);
    if (historyRes.data) setPriceHistory(historyRes.data);
  };

  // Implement React Query Mutation for Trade
  const tradeMutation = useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/trade`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ skillId, type: tradeType, quantity })
      });

      const result = await response.json();
      if (!response.ok || result.error) {
        throw new Error(result.error || 'Failed to execute trade');
      }
      return result;
    },
    onSuccess: () => {
      // Invalidate relevant queries so the rest of the app updates automatically
      queryClient.invalidateQueries({ queryKey: ['wallet'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      
      setSuccessMsg(`Successfully ${tradeType === 'buy' ? 'bought' : 'sold'} ${quantity} units!`);
      refreshProfile(); // Refresh context profile balance
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccessMsg(''), 3000);
    }
  });

  if (!skill) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const priceChange = ((skill.current_price - skill.initial_price) / skill.initial_price) * 100;
  const isPositive = priceChange >= 0;
  const totalCost = skill.current_price * quantity;

  const minPrice = priceHistory.length > 0 ? Math.min(...priceHistory.map(p => p.price)) : skill.current_price;
  const maxPrice = priceHistory.length > 0 ? Math.max(...priceHistory.map(p => p.price)) : skill.current_price;
  
  const chartData = priceHistory.map(p => {
    const date = new Date(p.created_at);
    let timeLabel = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    
    if (timeframe === '1W' || timeframe === 'ALL') {
      timeLabel = `${date.getDate()}/${date.getMonth() + 1} ${timeLabel}`;
    }

    return {
      time: timeLabel,
      price: p.price
    };
  });

  // Default external demand score to 1 if it hasn't been scraped yet
  const demandScore = skill.external_demand_score || 1;
  const isBullish = demandScore >= 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <button
        onClick={onBack}
        className="flex items-center space-x-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-5 h-5" />
        <span>Back to Market</span>
      </button>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">{skill.name}</h1>
            <div className="flex items-center space-x-4">
              <span className="text-4xl font-bold text-gray-900">
                {skill.current_price.toFixed(2)} JC
              </span>
              <div className={`flex items-center space-x-1 ${isPositive ? 'text-green-600' : 'text-red-600'}`}>
                {isPositive ? <TrendingUp className="w-6 h-6" /> : <TrendingDown className="w-6 h-6" />}
                <span className="text-lg font-bold">
                  {isPositive ? '+' : ''}{priceChange.toFixed(2)}%
                </span>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
              <h2 className="text-xl font-bold text-gray-900">Price History</h2>
              
              <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg">
                {(['1H', '1D', '1W', 'ALL'] as Timeframe[]).map((tf) => (
                  <button
                    key={tf}
                    onClick={() => setTimeframe(tf)}
                    className={`px-4 py-1.5 text-sm font-medium rounded-md transition-all ${
                      timeframe === tf
                        ? 'bg-white text-blue-600 shadow-sm'
                        : 'text-gray-500 hover:text-gray-900 hover:bg-gray-200/50'
                    }`}
                  >
                    {tf}
                  </button>
                ))}
              </div>
            </div>

            <div className="h-72 w-full relative">
              {priceHistory.length > 1 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart 
                    data={chartData}
                    margin={{ top: 10, right: 0, left: 0, bottom: 0 }}
                  >
                    <defs>
                      <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0.3}/>
                        <stop offset="95%" stopColor={isPositive ? '#22c55e' : '#ef4444'} stopOpacity={0}/>
                      </linearGradient>
                    </defs>
                    <XAxis dataKey="time" hide />
                    <YAxis domain={['dataMin', 'dataMax']} hide />
                    <Tooltip
                      cursor={{ stroke: '#9ca3af', strokeWidth: 1, strokeDasharray: '4 4' }}
                      contentStyle={{ 
                        borderRadius: '8px', 
                        border: 'none', 
                        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' 
                      }}
                      labelStyle={{ color: '#6b7280', marginBottom: '4px' }}
                      formatter={(value: number) => [`${value.toFixed(2)} JC`, 'Price']}
                    />
                    <Area
                      type="monotone"
                      dataKey="price"
                      stroke={isPositive ? '#22c55e' : '#ef4444'}
                      strokeWidth={3}
                      fillOpacity={1}
                      fill="url(#colorPrice)"
                      isAnimationActive={false}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                  {priceHistory.length === 1 
                    ? `Not enough data in the last ${timeframe} to draw a trend` 
                    : `No price history available in the last ${timeframe}`}
                </div>
              )}
            </div>
            
            <div className="flex justify-between text-sm text-gray-500 mt-4 font-medium">
              <span>Min: {minPrice.toFixed(2)} JC</span>
              <span>Max: {maxPrice.toFixed(2)} JC</span>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Market Stats Box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">Market Stats</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600">Initial Price</p>
                  <p className="text-lg font-bold text-gray-900">{skill.initial_price.toFixed(2)} JC</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Total Volume</p>
                  <p className="text-lg font-bold text-gray-900">{skill.total_buy_volume + skill.total_sell_volume}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Buy Volume</p>
                  <p className="text-lg font-bold text-green-600">{skill.total_buy_volume}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-600">Sell Volume</p>
                  <p className="text-lg font-bold text-red-600">{skill.total_sell_volume}</p>
                </div>
              </div>
            </div>

            {/* NEW: Real-World Job Market Box */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 relative overflow-hidden">
              <div className="absolute top-0 right-0 -mt-4 -mr-4 text-gray-100">
                <Briefcase className="w-32 h-32 opacity-50" />
              </div>
              <div className="relative z-10">
                <h2 className="text-xl font-bold text-gray-900 mb-4">Real-World Demand</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Active Job Listings</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {skill.current_job_listings ? skill.current_job_listings.toLocaleString() : 'Syncing...'}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Market Trend</p>
                    <div className="flex items-center space-x-2">
                      {isBullish ? (
                        <TrendingUp className="w-5 h-5 text-green-600" />
                      ) : (
                        <TrendingDown className="w-5 h-5 text-red-600" />
                      )}
                      <p className={`text-lg font-bold ${isBullish ? 'text-green-600' : 'text-red-600'}`}>
                        {isBullish ? 'Bullish (Hiring Up)' : 'Bearish (Hiring Down)'}
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="lg:col-span-1">
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 sticky top-20">
            <h2 className="text-xl font-bold text-gray-900 mb-6">Trade</h2>

            <div className="flex space-x-2 mb-6">
              <button
                onClick={() => setTradeType('buy')}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  tradeType === 'buy'
                    ? 'bg-green-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Buy
              </button>
              <button
                onClick={() => setTradeType('sell')}
                className={`flex-1 py-3 rounded-lg font-medium transition-colors ${
                  tradeType === 'sell'
                    ? 'bg-red-600 text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                Sell
              </button>
            </div>

            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quantity
              </label>
              <input
                type="number"
                min="1"
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div className="bg-gray-50 rounded-lg p-4 mb-6 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Price per unit</span>
                <span className="font-medium text-gray-900">{skill.current_price.toFixed(2)} JC</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Quantity</span>
                <span className="font-medium text-gray-900">{quantity}</span>
              </div>
              <div className="h-px bg-gray-200 my-2"></div>
              <div className="flex justify-between">
                <span className="font-medium text-gray-900">Total</span>
                <span className="text-xl font-bold text-gray-900">{totalCost.toFixed(2)} JC</span>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-gray-600">Your Balance</span>
                <span className="font-bold text-gray-900">{profile?.balance.toFixed(2)} JC</span>
              </div>
              {tradeType === 'buy' && totalCost > (profile?.balance || 0) && (
                <p className="text-sm text-red-600">Insufficient balance</p>
              )}
            </div>

            {/* Display React Query Error */}
            {tradeMutation.error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {tradeMutation.error.message}
              </div>
            )}

            {/* Display Success */}
            {successMsg && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                {successMsg}
              </div>
            )}

            <button
              onClick={() => tradeMutation.mutate()}
              disabled={tradeMutation.isPending || (tradeType === 'buy' && totalCost > (profile?.balance || 0))}
              className={`w-full py-3 rounded-lg font-bold transition-colors ${
                tradeType === 'buy'
                  ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300'
                  : 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300'
              }`}
            >
              {tradeMutation.isPending ? 'Processing...' : tradeType === 'buy' ? 'Buy Now' : 'Sell Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};