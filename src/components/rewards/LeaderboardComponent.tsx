import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Trophy, Medal, Award } from 'lucide-react';
import { api } from '../../lib/api';

interface LeaderboardEntry {
  user_id: string;
  total_points: number;
  users: {
    full_name: string;
    avatar_url?: string;
  };
}

const LeaderboardComponent: React.FC = () => {
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      setLoading(true);
      const data = await api.rewards.getLeaderboard();
      setLeaderboard(data as LeaderboardEntry[]);
    } catch (error) {
      console.error('Error loading leaderboard:', error);
    } finally {
      setLoading(false);
    }
  };

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="w-6 h-6 text-yellow-500" />;
      case 2:
        return <Medal className="w-6 h-6 text-gray-400" />;
      case 3:
        return <Award className="w-6 h-6 text-amber-600" />;
      default:
        return <span className="w-6 h-6 flex items-center justify-center text-sm font-bold text-gray-500">#{rank}</span>;
    }
  };

  const getRankBgColor = (rank: number) => {
    switch (rank) {
      case 1:
        return 'bg-gradient-to-r from-yellow-400 to-yellow-600';
      case 2:
        return 'bg-gradient-to-r from-gray-300 to-gray-500';
      case 3:
        return 'bg-gradient-to-r from-amber-400 to-amber-600';
      default:
        return 'bg-gray-100 dark:bg-gray-700';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (leaderboard.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <Trophy className="w-12 h-12 mx-auto mb-4 opacity-50" />
        <p>No leaderboard data available yet.</p>
        <p className="text-sm">Start earning points to appear here!</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {leaderboard.map((entry, index) => {
        const rank = index + 1;
        return (
          <motion.div
            key={entry.user_id}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: index * 0.1 }}
            className={`flex items-center space-x-4 p-4 rounded-lg ${getRankBgColor(rank)}`}
          >
            <div className="flex-shrink-0">
              {getRankIcon(rank)}
            </div>

            <div className="flex-shrink-0">
              {entry.users.avatar_url ? (
                <img
                  src={entry.users.avatar_url}
                  alt={entry.users.full_name}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {entry.users.full_name.charAt(0).toUpperCase()}
                  </span>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                {entry.users.full_name}
              </p>
              <p className="text-xs text-gray-600 dark:text-gray-300">
                {rank === 1 ? 'Champion' : rank === 2 ? 'Runner-up' : rank === 3 ? 'Third Place' : `Rank #${rank}`}
              </p>
            </div>

            <div className="flex-shrink-0 text-right">
              <div className="text-lg font-bold text-gray-900 dark:text-white">
                {entry.total_points.toLocaleString()}
              </div>
              <div className="text-xs text-gray-600 dark:text-gray-300">points</div>
            </div>
          </motion.div>
        );
      })}

      <div className="mt-6 text-center">
        <p className="text-sm text-gray-500">
          Leaderboard updates monthly. Keep earning points to climb the ranks! 🚀
        </p>
      </div>
    </div>
  );
};

export default LeaderboardComponent;
