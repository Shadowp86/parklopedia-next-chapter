import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, Users, Gift, Copy, Check, UserPlus } from 'lucide-react';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

interface ReferralStats {
  referral_code: string;
  total_referrals: number;
  recent_referrals: Array<{
    created_at: string;
    users: {
      full_name: string;
      avatar_url?: string;
    };
  }>;
}

const ReferralSystem: React.FC = () => {
  const { user } = useAuth();
  const [referralStats, setReferralStats] = useState<ReferralStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [referralCode, setReferralCode] = useState('');
  const [showApplyForm, setShowApplyForm] = useState(false);
  const [applyCode, setApplyCode] = useState('');
  const [applying, setApplying] = useState(false);

  useEffect(() => {
    if (user?.id) {
      loadReferralStats();
    }
  }, [user]);

  const loadReferralStats = async () => {
    if (!user?.id) return;

    try {
      setLoading(true);
      // Call referral system function
      const { data, error } = await supabase.functions.invoke('referral-system', {
        body: {
          action: 'get_referral_stats',
          user_id: user.id
        }
      });

      if (error) throw error;

      setReferralStats(data);
      setReferralCode(data.referral_code || '');
    } catch (error) {
      console.error('Error loading referral stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const generateReferralCode = async () => {
    if (!user?.id) return;

    try {
      const { data, error } = await supabase.functions.invoke('referral-system', {
        body: {
          action: 'generate_code',
          user_id: user.id
        }
      });

      if (error) throw error;

      setReferralCode(data.referral_code);
      await loadReferralStats();
    } catch (error) {
      console.error('Error generating referral code:', error);
    }
  };

  const copyToClipboard = async () => {
    try {
      await navigator.clipboard.writeText(referralCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error copying to clipboard:', error);
    }
  };

  const shareReferralLink = async () => {
    const referralLink = `${window.location.origin}/signup?ref=${referralCode}`;

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Parklopedia with my referral!',
          text: 'Get bonus points when you sign up using my referral code.',
          url: referralLink
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      copyToClipboard();
    }
  };

  const applyReferralCode = async () => {
    if (!user?.id || !applyCode.trim()) return;

    try {
      setApplying(true);
      const { error } = await supabase.functions.invoke('referral-system', {
        body: {
          action: 'apply_referral',
          user_id: user.id,
          referral_code: applyCode.trim()
        }
      });

      if (error) throw error;

      alert(`Referral applied successfully! You and your referrer both received bonus points! 🎉`);
      setShowApplyForm(false);
      setApplyCode('');
      await loadReferralStats();
    } catch (error: any) {
      alert(`Error: ${error.message}`);
    } finally {
      setApplying(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-8 bg-gray-200 rounded w-1/3"></div>
        <div className="h-32 bg-gray-200 rounded"></div>
        <div className="h-24 bg-gray-200 rounded"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Referral Code Section */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-blue-100 rounded-full">
              <Share2 className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Referral Program</h3>
              <p className="text-sm text-gray-600">Earn points by referring friends</p>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-blue-600">{referralStats?.total_referrals || 0}</div>
            <div className="text-sm text-gray-500">Friends Referred</div>
          </div>
        </div>

        {!referralCode ? (
          <div className="text-center py-6">
            <button
              onClick={generateReferralCode}
              className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Generate Referral Code
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex items-center space-x-3 p-4 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="text-sm text-gray-600 mb-1">Your Referral Code</div>
                <div className="font-mono text-lg font-bold text-gray-900">{referralCode}</div>
              </div>
              <div className="flex space-x-2">
                <button
                  onClick={copyToClipboard}
                  className="p-2 text-gray-600 hover:text-gray-900 transition-colors"
                  title="Copy code"
                >
                  <AnimatePresence mode="wait">
                    {copied ? (
                      <motion.div
                        key="check"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Check className="w-5 h-5 text-green-600" />
                      </motion.div>
                    ) : (
                      <motion.div
                        key="copy"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                      >
                        <Copy className="w-5 h-5" />
                      </motion.div>
                    )}
                  </AnimatePresence>
                </button>
                <button
                  onClick={shareReferralLink}
                  className="p-2 text-blue-600 hover:text-blue-700 transition-colors"
                  title="Share referral link"
                >
                  <Share2 className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">100</div>
                <div className="text-sm text-gray-600">Points for You</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">50</div>
                <div className="text-sm text-gray-600">Points for Friend</div>
              </div>
              <div className="text-center p-4 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">∞</div>
                <div className="text-sm text-gray-600">Unlimited Referrals</div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Apply Referral Code Section */}
      <div className="bg-white p-6 rounded-lg border">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-100 rounded-full">
              <UserPlus className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Have a Referral Code?</h3>
              <p className="text-sm text-gray-600">Apply it to get bonus points</p>
            </div>
          </div>
          <button
            onClick={() => setShowApplyForm(!showApplyForm)}
            className="px-4 py-2 text-blue-600 hover:text-blue-700 transition-colors"
          >
            {showApplyForm ? 'Cancel' : 'Apply Code'}
          </button>
        </div>

        <AnimatePresence>
          {showApplyForm && (
            <motion.div
              initial={{ height: 0, opacity: 0 }}
              animate={{ height: 'auto', opacity: 1 }}
              exit={{ height: 0, opacity: 0 }}
              className="overflow-hidden"
            >
              <div className="pt-4 border-t">
                <div className="flex space-x-3">
                  <input
                    type="text"
                    value={applyCode}
                    onChange={(e) => setApplyCode(e.target.value.toUpperCase())}
                    placeholder="Enter referral code"
                    className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                  <button
                    onClick={applyReferralCode}
                    disabled={applying || !applyCode.trim()}
                    className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    {applying ? 'Applying...' : 'Apply'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Recent Referrals */}
      {referralStats && referralStats.recent_referrals.length > 0 && (
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center space-x-3 mb-4">
            <div className="p-2 bg-purple-100 rounded-full">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900">Recent Referrals</h3>
          </div>

          <div className="space-y-3">
            {referralStats.recent_referrals.map((referral, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  {referral.users.avatar_url ? (
                    <img
                      src={referral.users.avatar_url}
                      alt={referral.users.full_name}
                      className="w-10 h-10 rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center">
                      <span className="text-sm font-medium text-gray-700">
                        {referral.users.full_name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <p className="font-medium text-gray-900">{referral.users.full_name}</p>
                    <p className="text-sm text-gray-500">
                      {new Date(referral.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2 text-green-600">
                  <Gift className="w-4 h-4" />
                  <span className="text-sm font-medium">+100 points</span>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* How It Works */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-lg border">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">How Referral Program Works</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center">
            <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-blue-600 font-bold">1</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Share Your Code</h4>
            <p className="text-sm text-gray-600">Generate and share your unique referral code with friends</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-green-600 font-bold">2</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Friend Signs Up</h4>
            <p className="text-sm text-gray-600">Your friend creates an account using your referral code</p>
          </div>
          <div className="text-center">
            <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <span className="text-purple-600 font-bold">3</span>
            </div>
            <h4 className="font-medium text-gray-900 mb-2">Both Get Rewarded</h4>
            <p className="text-sm text-gray-600">You get 100 points, your friend gets 50 points instantly</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReferralSystem;
