import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Flame, Calendar, Trophy } from 'lucide-react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface UserStats {
  current_streak: number;
  longest_streak: number;
  last_activity_date: string;
}

const StreakTracker: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user?.id) {
      loadUserStats();
      updateStreak(); // Update streak on component mount
    }
  }, [user]);

  const loadUserStats = async () => {
    if (!user?.id) return;

    try {
      const stats = await api.rewards.getUserStats(user.id);
      setUserStats(stats as UserStats);
    } catch (error) {
      console.error('Error loading user stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateStreak = async () => {
    if (!user?.id) return;

    try {
      // Call the streak-updater edge function
      const { error } = await supabase.functions.invoke('streak-updater', {
        body: { user_id: user.id }
      });

      if (error) throw error;

      await loadUserStats(); // Refresh stats after update
    } catch (error) {
      console.error('Error updating streak:', error);
    }
  };

  const getStreakStatus = () => {
    if (!userStats) return { status: 'unknown', message: 'Loading...' };

    const lastActivity = new Date(userStats.last_activity_date);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    const lastActivityDate = new Date(lastActivity.getFullYear(), lastActivity.getMonth(), lastActivity.getDate());
    const todayDate = new Date(today.getFullYear(), today.getMonth(), today.getDate());
    const yesterdayDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate());

    if (lastActivityDate.getTime() === todayDate.getTime()) {
      return { status: 'active', message: 'Keep it up! 🔥' };
    } else if (lastActivityDate.getTime() === yesterdayDate.getTime()) {
      return { status: 'warning', message: 'Log in today to maintain your streak!' };
    } else {
      return { status: 'broken', message: 'Start a new streak today!' };
    }
  };

  const getStreakColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'text-orange-500';
      case 'warning':
        return 'text-yellow-500';
      case 'broken':
        return 'text-gray-400';
      default:
        return 'text-gray-400';
    }
  };

  const getStreakBgColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-orange-100 border-orange-200';
      case 'warning':
        return 'bg-yellow-100 border-yellow-200';
      case 'broken':
        return 'bg-gray-100 border-gray-200';
      default:
        return 'bg-gray-100 border-gray-200';
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse">
        <div className="bg-white p-6 rounded-lg border">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-8 bg-gray-200 rounded w-1/2 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/3"></div>
        </div>
      </div>
    );
  }

  const streakStatus = getStreakStatus();

  return (
    <div className={`p-6 rounded-lg border-2 ${getStreakBgColor(streakStatus.status)}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-3">
          <div className={`p-2 rounded-full ${streakStatus.status === 'active' ? 'bg-orange-500' : 'bg-gray-400'}`}>
            <Flame className="w-6 h-6 text-white" />
          </div>
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Daily Streak</h3>
            <p className={`text-sm ${getStreakColor(streakStatus.status)}`}>
              {streakStatus.message}
            </p>
          </div>
        </div>
        <div className="text-right">
          <div className={`text-3xl font-bold ${getStreakColor(streakStatus.status)}`}>
            {userStats?.current_streak || 0}
          </div>
          <div className="text-sm text-gray-500">days</div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 mb-4">
        <div className="text-center">
          <div className="text-2xl font-bold text-blue-600">{userStats?.current_streak || 0}</div>
          <div className="text-sm text-gray-600">Current Streak</div>
        </div>
        <div className="text-center">
          <div className="text-2xl font-bold text-purple-600">{userStats?.longest_streak || 0}</div>
          <div className="text-sm text-gray-600">Best Streak</div>
        </div>
      </div>

      {/* Streak Calendar Visualization */}
      <div className="space-y-2">
        <div className="flex items-center space-x-2 text-sm text-gray-600">
          <Calendar className="w-4 h-4" />
          <span>Last 7 days</span>
        </div>
        <div className="flex space-x-1">
          {Array.from({ length: 7 }, (_, i) => {
            const date = new Date();
            date.setDate(date.getDate() - (6 - i));
            const isActive = userStats && new Date(userStats.last_activity_date) >= date;

            return (
              <motion.div
                key={i}
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ delay: i * 0.1 }}
                className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                  isActive
                    ? 'bg-orange-500 text-white'
                    : 'bg-gray-200 text-gray-400'
                }`}
              >
                {date.getDate()}
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Streak Milestones */}
      <div className="mt-4 pt-4 border-t border-gray-200">
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-2">
          <Trophy className="w-4 h-4" />
          <span>Next Milestone</span>
        </div>
        <div className="space-y-1">
          {[7, 14, 30, 60, 100].map((milestone) => {
            const current = userStats?.current_streak || 0;
            const progress = Math.min((current / milestone) * 100, 100);
            const isCompleted = current >= milestone;

            return (
              <div key={milestone} className="flex items-center space-x-3">
                <div className="flex-1">
                  <div className="flex justify-between text-sm mb-1">
                    <span className={isCompleted ? 'text-orange-600 font-medium' : 'text-gray-600'}>
                      {milestone} day streak
                    </span>
                    <span className="text-gray-400">
                      {isCompleted ? '✓' : `${milestone - current} days left`}
                    </span>
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-2">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${progress}%` }}
                      transition={{ duration: 1, delay: 0.5 }}
                      className={`h-2 rounded-full ${
                        isCompleted ? 'bg-orange-500' : 'bg-blue-500'
                      }`}
                    />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default StreakTracker;
