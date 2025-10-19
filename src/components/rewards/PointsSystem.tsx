import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, Star, Zap, Car, FileText, Calendar, Award } from 'lucide-react';
import { api } from '../../lib/api';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface PointsActivity {
  id: string;
  action_type: string;
  points_awarded: number;
  earned_at: string;
  metadata?: any;
}

const PointsSystem: React.FC = () => {
  const { user } = useAuth();
  const [activities, setActivities] = useState<PointsActivity[]>([]);
  const [showPointsPopup, setShowPointsPopup] = useState(false);
  const [earnedPoints, setEarnedPoints] = useState(0);

  useEffect(() => {
    if (user?.id) {
      loadRecentActivities();
    }
  }, [user]);

  const loadRecentActivities = async () => {
    if (!user?.id) return;

    try {
      const data: any = await api.rewards.getUserRewards(user.id);
      setActivities(data.slice(0, 10)); // Get last 10 activities
    } catch (error) {
      console.error('Error loading activities:', error);
    }
  };

  const awardPoints = async (action: string, points: number, metadata?: any) => {
    if (!user?.id) return;

    try {
      // Since awardPoints doesn't exist in the API service, we'll use direct supabase call
      const { error } = await supabase
        .from('rewards')
        .insert({
          user_id: user.id,
          points_awarded: points,
          action_type: action,
          metadata: metadata
        });

      if (error) throw error;

      setEarnedPoints(points);
      setShowPointsPopup(true);

      // Hide popup after 3 seconds
      setTimeout(() => setShowPointsPopup(false), 3000);

      // Refresh activities
      await loadRecentActivities();
    } catch (error) {
      console.error('Error awarding points:', error);
    }
  };

  const getActivityIcon = (actionType: string) => {
    switch (actionType) {
      case 'vehicle_added':
        return <Car className="w-4 h-4 text-blue-500" />;
      case 'document_uploaded':
        return <FileText className="w-4 h-4 text-green-500" />;
      case 'booking_made':
        return <Calendar className="w-4 h-4 text-purple-500" />;
      case 'achievement_unlocked':
        return <Award className="w-4 h-4 text-yellow-500" />;
      case 'streak_bonus':
        return <Zap className="w-4 h-4 text-orange-500" />;
      default:
        return <Star className="w-4 h-4 text-gray-500" />;
    }
  };

  const getActivityDescription = (actionType: string, metadata?: any) => {
    switch (actionType) {
      case 'vehicle_added':
        return 'Added a new vehicle';
      case 'document_uploaded':
        return 'Uploaded vehicle document';
      case 'booking_made':
        return 'Made a parking booking';
      case 'achievement_unlocked':
        return `Unlocked "${metadata?.achievement_name || 'achievement'}"`;
      case 'streak_bonus':
        return 'Daily streak bonus';
      default:
        return actionType.replace('_', ' ');
    }
  };

  // Example usage - these would be called from various components
  const exampleActions = [
    { action: 'vehicle_added', points: 50, label: 'Add Vehicle' },
    { action: 'document_uploaded', points: 25, label: 'Upload Document' },
    { action: 'booking_made', points: 30, label: 'Make Booking' },
  ];

  return (
    <div className="space-y-6">
      {/* Points Popup */}
      <AnimatePresence>
        {showPointsPopup && (
          <motion.div
            initial={{ opacity: 0, scale: 0.8, y: -50 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8, y: -50 }}
            className="fixed top-20 right-4 z-50 bg-green-500 text-white px-6 py-3 rounded-lg shadow-lg flex items-center space-x-2"
          >
            <Plus className="w-5 h-5" />
            <span className="font-bold">+{earnedPoints} points earned!</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Example Action Buttons (for testing) */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Test Points System</h3>
        <div className="flex flex-wrap gap-2">
          {exampleActions.map((action) => (
            <button
              key={action.action}
              onClick={() => awardPoints(action.action, action.points)}
              className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors flex items-center space-x-2"
            >
              <Plus className="w-4 h-4" />
              <span>{action.label} (+{action.points})</span>
            </button>
          ))}
        </div>
      </div>

      {/* Recent Activities */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">Recent Points Activity</h3>
        <div className="space-y-3">
          {activities.length === 0 ? (
            <p className="text-gray-500 text-center py-4">No recent activity</p>
          ) : (
            activities.map((activity) => (
              <motion.div
                key={activity.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {getActivityIcon(activity.action_type)}
                  <div>
                    <p className="font-medium text-gray-900">
                      {getActivityDescription(activity.action_type, activity.metadata)}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(activity.earned_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1 text-green-600 font-semibold">
                  <Plus className="w-4 h-4" />
                  <span>{activity.points_awarded}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Points Earning Guide */}
      <div className="bg-white p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-4">How to Earn Points</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="flex items-start space-x-3">
            <Car className="w-5 h-5 text-blue-500 mt-1" />
            <div>
              <p className="font-medium">Add Vehicle</p>
              <p className="text-sm text-gray-600">+50 points for each vehicle added</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <FileText className="w-5 h-5 text-green-500 mt-1" />
            <div>
              <p className="font-medium">Upload Documents</p>
              <p className="text-sm text-gray-600">+25 points per document</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Calendar className="w-5 h-5 text-purple-500 mt-1" />
            <div>
              <p className="font-medium">Make Bookings</p>
              <p className="text-sm text-gray-600">+30 points per booking</p>
            </div>
          </div>
          <div className="flex items-start space-x-3">
            <Award className="w-5 h-5 text-yellow-500 mt-1" />
            <div>
              <p className="font-medium">Achievements</p>
              <p className="text-sm text-gray-600">+50-300 points for achievements</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PointsSystem;
