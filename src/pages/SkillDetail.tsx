import { useEffect, useState } from 'react';
import { ArrowLeft, TrendingUp, TrendingDown } from 'lucide-react';
import { supabase, Skill, PriceHistory } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

interface SkillDetailProps {
  skillId: string;
  onBack: () => void;
}

export const SkillDetail = ({ skillId, onBack }: SkillDetailProps) => {
  const [skill, setSkill] = useState<Skill | null>(null);
  const [priceHistory, setPriceHistory] = useState<PriceHistory[]>([]);
  const [quantity, setQuantity] = useState(1);
  const [tradeType, setTradeType] = useState<'buy' | 'sell'>('buy');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const { profile, refreshProfile } = useAuth();

  useEffect(() => {
    fetchSkillData();
    const channel = supabase
      .channel(`skill-${skillId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'skills', filter: `id=eq.${skillId}` }, () => {
        fetchSkillData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [skillId]);

  const fetchSkillData = async () => {
    const [skillRes, historyRes] = await Promise.all([
      supabase.from('skills').select('*').eq('id', skillId).single(),
      supabase.from('price_history').select('*').eq('skill_id', skillId).order('created_at', { ascending: true }).limit(50),
    ]);

    if (skillRes.data) setSkill(skillRes.data);
    if (historyRes.data) setPriceHistory(historyRes.data);
  };

  const handleTrade = async () => {
    if (!skill || !profile) return;

    setError('');
    setSuccess('');
    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/execute-trade`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          },
          body: JSON.stringify({
            skillId: skill.id,
            type: tradeType,
            quantity: quantity,
          }),
        }
      );

      const data = await response.json();

      if (response.ok) {
        setSuccess(data.message);
        await refreshProfile();
        await fetchSkillData();
        setQuantity(1);
      } else {
        setError(data.error || 'Trade failed');
      }
    } catch (err) {
      setError('Failed to execute trade');
    }

    setLoading(false);
  };

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

  const minPrice = Math.min(...priceHistory.map(p => p.price));
  const maxPrice = Math.max(...priceHistory.map(p => p.price));
  const priceRange = maxPrice - minPrice || 1;

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
            <h2 className="text-xl font-bold text-gray-900 mb-4">Price History</h2>
            <div className="h-64 relative">
              {priceHistory.length > 0 ? (
                <svg className="w-full h-full" viewBox="0 0 800 200" preserveAspectRatio="none">
                  <polyline
                    fill="none"
                    stroke="#2563eb"
                    strokeWidth="2"
                    points={priceHistory.map((p, i) => {
                      const x = (i / (priceHistory.length - 1)) * 800;
                      const y = 200 - ((p.price - minPrice) / priceRange) * 180;
                      return `${x},${y}`;
                    }).join(' ')}
                  />
                  <polyline
                    fill="rgba(37, 99, 235, 0.1)"
                    stroke="none"
                    points={`0,200 ${priceHistory.map((p, i) => {
                      const x = (i / (priceHistory.length - 1)) * 800;
                      const y = 200 - ((p.price - minPrice) / priceRange) * 180;
                      return `${x},${y}`;
                    }).join(' ')} 800,200`}
                  />
                </svg>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-400">
                  No price history available
                </div>
              )}
            </div>
            <div className="flex justify-between text-sm text-gray-600 mt-2">
              <span>Min: {minPrice.toFixed(2)} JC</span>
              <span>Max: {maxPrice.toFixed(2)} JC</span>
            </div>
          </div>

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

            {error && (
              <div className="bg-red-50 text-red-700 px-4 py-3 rounded-lg text-sm mb-4">
                {error}
              </div>
            )}

            {success && (
              <div className="bg-green-50 text-green-700 px-4 py-3 rounded-lg text-sm mb-4">
                {success}
              </div>
            )}

            <button
              onClick={handleTrade}
              disabled={loading || (tradeType === 'buy' && totalCost > (profile?.balance || 0))}
              className={`w-full py-3 rounded-lg font-bold transition-colors ${
                tradeType === 'buy'
                  ? 'bg-green-600 hover:bg-green-700 text-white disabled:bg-gray-300'
                  : 'bg-red-600 hover:bg-red-700 text-white disabled:bg-gray-300'
              }`}
            >
              {loading ? 'Processing...' : tradeType === 'buy' ? 'Buy Now' : 'Sell Now'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
