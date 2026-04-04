import { useEffect, useState } from 'react';
import { Trophy, Medal, TrendingUp } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

interface LeaderboardEntry {
  userId: string;
  email: string;
  balance: number;
  portfolioValue: number;
  totalWealth: number;
  profit: number;
  profitPercentage: string;
}

export const Leaderboard = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    fetchLeaderboard();
  }, []);

  const fetchLeaderboard = async () => {
    try {
      // Call the Express backend instead of the Supabase Edge Function
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard`);
      
      const data = await response.json();
      if (data.leaderboard) {
        setLeaderboard(data.leaderboard);
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
    }
    setLoading(false);
  };

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
    return null;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  const userRank = leaderboard.findIndex(entry => entry.userId === user?.id) + 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Leaderboard</h1>
        <p className="text-gray-600">Top traders ranked by profit</p>
      </div>

      {userRank > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Your Rank</p>
                <p className="text-2xl font-bold text-blue-600">#{userRank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-900">Total Profit</p>
              <p className={`text-xl font-bold ${
                leaderboard[userRank - 1].profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {leaderboard[userRank - 1].profit >= 0 ? '+' : ''}
                {leaderboard[userRank - 1].profit.toFixed(2)} JC
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50 border-b border-gray-200">
              <tr>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Rank
                </th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Trader
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Portfolio Value
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Total Wealth
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Profit/Loss
                </th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">
                  Return %
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.userId === user?.id;

                return (
                  <tr
                    key={entry.userId}
                    className={`${isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'}`}
                  >
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getMedalIcon(rank)}
                        <span className="text-lg font-bold text-gray-900">#{rank}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900">{entry.email}</span>
                        {isCurrentUser && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">
                            You
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-gray-900 font-medium">
                        {entry.portfolioValue.toFixed(2)} JC
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className="text-gray-900 font-bold">
                        {entry.totalWealth.toFixed(2)} JC
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`font-bold ${
                        entry.profit >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {entry.profit >= 0 ? '+' : ''}{entry.profit.toFixed(2)} JC
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`font-bold ${
                        parseFloat(entry.profitPercentage) >= 0 ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {parseFloat(entry.profitPercentage) >= 0 ? '+' : ''}
                        {entry.profitPercentage}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {leaderboard.length === 0 && (
        <div className="text-center py-12 text-gray-500">
          <Trophy className="w-16 h-16 mx-auto mb-4 text-gray-300" />
          <p>No traders yet</p>
          <p className="text-sm">Be the first to start trading!</p>
        </div>
      )}
    </div>
  );
};
