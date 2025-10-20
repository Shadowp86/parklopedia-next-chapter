import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Card, Button } from '../components/ui';
import { useAuth } from '../contexts/AuthContext';
import { api } from '../lib/api';

interface Reward {
  id: string;
  name: string;
  description: string;
  points_required: number;
  reward_type: string;
  value: number;
  is_active: boolean;
}

interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  points_awarded: number;
  unlocked_at: string;
}

interface UserStats {
  total_points: number;
  current_streak: number;
  longest_streak: number;
  achievements_unlocked: number;
  rewards_redeemed: number;
}

const Rewards: React.FC = () => {
  const { user } = useAuth();
  const [userStats, setUserStats] = useState<UserStats | null>(null);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [availableRewards, setAvailableRewards] = useState<Reward[]>([]);
  const [userRewards, setUserRewards] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedTab, setSelectedTab] = useState<'achievements' | 'rewards' | 'leaderboard'>('achievements');

  useEffect(() => {
    if (user?.id) {
      loadRewardsData();
    }
  }, [user]);

  const loadRewardsData = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      const [statsRes, achievementsRes, rewardsRes, userRewardsRes] = await Promise.all([
        api.rewards.getUserStats(user.id),
        api.rewards.getUserAchievements(user.id),
        api.rewards.getAvailableRewards(),
        api.rewards.getUserRewards(user.id)
      ]);

      setUserStats(statsRes as UserStats);
      setAchievements(achievementsRes as Achievement[]);
      setAvailableRewards(rewardsRes as Reward[]);
      setUserRewards(userRewardsRes as any[]);
    } catch (error) {
      console.error('Error loading rewards data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRedeemReward = async (rewardId: string) => {
    if (!user?.id || !userStats || userStats.total_points < availableRewards.find(r => r.id === rewardId)?.points_required!) {
      return;
    }

    try {
      await api.rewards.redeemReward(user.id, rewardId);
      await loadRewardsData(); // Refresh data
    } catch (error) {
      console.error('Error redeeming reward:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Rewards & Achievements</h1>
              <p className="mt-2 text-gray-600">Earn points, unlock achievements, and redeem rewards</p>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-blue-600">{userStats?.total_points || 0}</div>
              <div className="text-sm text-gray-500">Total Points</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <span className="text-blue-600 font-semibold">🏆</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{userStats?.achievements_unlocked || 0}</div>
                <div className="text-sm text-gray-500">Achievements</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <span className="text-green-600 font-semibold">🔥</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{userStats?.current_streak || 0}</div>
                <div className="text-sm text-gray-500">Day Streak</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-purple-100 rounded-full flex items-center justify-center">
                  <span className="text-purple-600 font-semibold">🎁</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{userStats?.rewards_redeemed || 0}</div>
                <div className="text-sm text-gray-500">Rewards Redeemed</div>
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="w-8 h-8 bg-orange-100 rounded-full flex items-center justify-center">
                  <span className="text-orange-600 font-semibold">⭐</span>
                </div>
              </div>
              <div className="ml-4">
                <div className="text-2xl font-bold text-gray-900">{userStats?.longest_streak || 0}</div>
                <div className="text-sm text-gray-500">Best Streak</div>
              </div>
            </div>
          </Card>
        </div>

        {/* Tab Navigation */}
        <div className="flex space-x-1 mb-6 bg-gray-100 p-1 rounded-lg">
          {[
            { id: 'achievements', label: 'Achievements', icon: '🏆' },
            { id: 'rewards', label: 'Rewards', icon: '🎁' },
            { id: 'leaderboard', label: 'Leaderboard', icon: '📊' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedTab(tab.id as any)}
              className={`flex-1 flex items-center justify-center px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                selectedTab === tab.id
                  ? 'bg-white text-gray-900 shadow-sm'
                  : 'text-gray-500 hover:text-gray-700'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {selectedTab === 'achievements' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {achievements.map((achievement) => (
              <motion.div
                key={achievement.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                <Card className="p-6 hover:shadow-lg transition-shadow">
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center">
                        <span className="text-2xl">{achievement.icon}</span>
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-gray-900">{achievement.name}</h3>
                      <p className="text-sm text-gray-600 mt-1">{achievement.description}</p>
                      <div className="flex items-center justify-between mt-3">
                        <span className="text-sm font-medium text-green-600">+{achievement.points_awarded} points</span>
                        <span className="text-xs text-gray-500">
                          {new Date(achievement.unlocked_at).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                </Card>
              </motion.div>
            ))}
            {achievements.length === 0 && (
              <div className="col-span-full text-center py-12">
                <div className="text-6xl mb-4">🏆</div>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements yet</h3>
                <p className="text-gray-500">Start using Parklopedia to unlock your first achievement!</p>
              </div>
            )}
          </div>
        )}

        {selectedTab === 'rewards' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {availableRewards.map((reward) => {
              const canRedeem = userStats && userStats.total_points >= reward.points_required;
              const hasRedeemed = userRewards.some(ur => ur.reward_id === reward.id);

              return (
                <motion.div
                  key={reward.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <Card className={`p-6 hover:shadow-lg transition-shadow ${hasRedeemed ? 'opacity-60' : ''}`}>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-gray-900">{reward.name}</h3>
                        <p className="text-sm text-gray-600 mt-1">{reward.description}</p>
                        <div className="flex items-center justify-between mt-4">
                          <span className="text-lg font-bold text-blue-600">{reward.points_required} points</span>
                          <span className="text-sm text-gray-500">
                            {reward.reward_type === 'discount' ? `${reward.value}% off` :
                             reward.reward_type === 'cashback' ? `₹${reward.value}` :
                             reward.value}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      {hasRedeemed ? (
                        <Button disabled className="w-full">
                          Already Redeemed
                        </Button>
                      ) : (
                        <Button
                          onClick={() => handleRedeemReward(reward.id)}
                          disabled={!canRedeem}
                          className="w-full"
                          variant={canRedeem ? 'primary' : 'secondary'}
                        >
                          {canRedeem ? 'Redeem Reward' : `Need ${reward.points_required - (userStats?.total_points || 0)} more points`}
                        </Button>
                      )}
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        )}

        {selectedTab === 'leaderboard' && (
          <Card className="p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Leaderboard</h3>
            <div className="space-y-4">
              {/* Placeholder leaderboard - would be populated from API */}
              <div className="text-center py-8 text-gray-500">
                Leaderboard feature coming soon! 🏆
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
};

export default Rewards;
