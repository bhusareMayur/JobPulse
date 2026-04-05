import { useState } from 'react';
import { Trophy, Medal, TrendingUp, Filter } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';
import { useQuery } from '@tanstack/react-query';

interface LeaderboardEntry {
  userId: string;
  name?: string;
  batch: number;
  balance: number;
  portfolioValue: number;
  totalWealth: number;
  profit: number;
  profitPercentage: string;
}

export const Leaderboard = () => {
  const { user } = useAuth();
  
  // NEW: State to track the selected batch filter
  const [selectedYear, setSelectedYear] = useState<string>('all');

  const { data, isLoading, isError } = useQuery({
    // The query key now includes the selectedYear, so it refetches automatically when changed
    queryKey: ['leaderboard', selectedYear],
    queryFn: async () => {
      const response = await fetch(`${import.meta.env.VITE_API_URL}/api/leaderboard?year=${selectedYear}`);
      if (!response.ok) throw new Error('Failed to fetch leaderboard');
      return response.json();
    },
    refetchInterval: 10000,
  });

  const getMedalIcon = (rank: number) => {
    if (rank === 1) return <Trophy className="w-6 h-6 text-yellow-500" />;
    if (rank === 2) return <Medal className="w-6 h-6 text-gray-400" />;
    if (rank === 3) return <Medal className="w-6 h-6 text-amber-700" />;
    return null;
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center justify-center h-64 text-red-600">
        Error loading data. Please try again.
      </div>
    );
  }

  const leaderboard: LeaderboardEntry[] = data?.leaderboard || [];
  const userRank = leaderboard.findIndex(entry => entry.userId === user?.id) + 1;

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end mb-8 gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Top Market Analysts</h1>
          <p className="text-gray-600">Top analysts ranked by portfolio growth</p>
        </div>

        {/* --- NEW: BATCH FILTER DROPDOWN --- */}
        <div className="flex items-center space-x-2 bg-white p-2 rounded-lg border border-gray-200 shadow-sm">
          <Filter className="w-5 h-5 text-gray-400 ml-2" />
          <select 
            value={selectedYear}
            onChange={(e) => setSelectedYear(e.target.value)}
            className="bg-transparent border-none text-gray-700 font-bold focus:ring-0 outline-none pr-4 py-1 cursor-pointer"
          >
            <option value="all">All Batches (Global)</option>
            <option value="2026">2026 Batch (Seniors)</option>
            <option value="2027">2027 Batch</option>
            <option value="2028">2028 Batch</option>
            <option value="2029">2029 Batch (Freshers)</option>
          </select>
        </div>
      </div>

      {userRank > 0 && selectedYear === 'all' && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <TrendingUp className="w-6 h-6 text-blue-600" />
              <div>
                <p className="font-medium text-blue-900">Your Global Rank</p>
                <p className="text-2xl font-bold text-blue-600">#{userRank}</p>
              </div>
            </div>
            <div className="text-right">
              <p className="text-sm text-blue-900">Total Growth</p>
              <p className={`text-xl font-bold ${
                leaderboard[userRank - 1]?.profit >= 0 ? 'text-green-600' : 'text-red-600'
              }`}>
                {leaderboard[userRank - 1]?.profit >= 0 ? '+' : ''}
                {leaderboard[userRank - 1]?.profit.toFixed(2)} JC
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
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">Analyst Name</th>
                <th className="px-6 py-4 text-center text-xs font-bold text-gray-700 uppercase tracking-wider">Batch</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Portfolio Value</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Total Score</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Growth</th>
                <th className="px-6 py-4 text-right text-xs font-bold text-gray-700 uppercase tracking-wider">Return %</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {leaderboard.map((entry, index) => {
                const rank = index + 1;
                const isCurrentUser = entry.userId === user?.id;

                return (
                  <tr key={entry.userId} className={`${isCurrentUser ? 'bg-blue-50' : 'hover:bg-gray-50'}`}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        {getMedalIcon(rank)}
                        <span className="text-lg font-bold text-gray-900">#{rank}</span>
                      </div>
                    </td>
                    
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center space-x-2">
                        <span className="font-bold text-gray-900">{entry.name || 'Unknown Analyst'}</span>
                        {isCurrentUser && (
                          <span className="px-2 py-1 bg-blue-100 text-blue-700 text-xs font-medium rounded">You</span>
                        )}
                      </div>
                    </td>

                    {/* NEW: Batch Column */}
                    <td className="px-6 py-4 whitespace-nowrap text-center">
                      <span className="bg-gray-100 text-gray-600 px-3 py-1 rounded-full text-xs font-bold border border-gray-200">
                        {entry.batch}
                      </span>
                    </td>

                    <td className="px-6 py-4 whitespace-nowrap text-right font-medium text-gray-900">
                      {entry.portfolioValue.toFixed(2)} JC
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right font-bold text-gray-900">
                      {entry.totalWealth.toFixed(2)} JC
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`font-bold ${entry.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {entry.profit >= 0 ? '+' : ''}{entry.profit.toFixed(2)} JC
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right">
                      <span className={`font-bold ${parseFloat(entry.profitPercentage) >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {parseFloat(entry.profitPercentage) >= 0 ? '+' : ''}{entry.profitPercentage}%
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
          <p>No analysts found for this batch.</p>
        </div>
      )}
    </div>
  );
};