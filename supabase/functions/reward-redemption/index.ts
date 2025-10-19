import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    );

    const { user_id, reward_id } = await req.json();

    if (!user_id || !reward_id) {
      throw new Error('User ID and Reward ID are required');
    }

    // Get reward details
    const { data: reward, error: rewardError } = await supabaseClient
      .from('reward_catalog')
      .select('*')
      .eq('id', reward_id)
      .single();

    if (rewardError || !reward) {
      throw new Error('Reward not found');
    }

    // Get user stats
    const { data: userStats, error: statsError } = await supabaseClient
      .from('user_stats')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (statsError || !userStats) {
      throw new Error('User stats not found');
    }

    // Check if user has enough points
    if (userStats.total_points < reward.points_required) {
      throw new Error('Insufficient points');
    }

    // Check if reward already redeemed (if one-time reward)
    if (reward.max_redemptions_per_user === 1) {
      const { data: existingRedemption } = await supabaseClient
        .from('user_rewards')
        .select('id')
        .eq('user_id', user_id)
        .eq('reward_id', reward_id)
        .single();

      if (existingRedemption) {
        throw new Error('Reward already redeemed');
      }
    }

    // Process redemption based on reward type
    let redemptionResult = null;

    switch (reward.reward_type) {
      case 'discount':
        // Create discount code
        const discountCode = `DISCOUNT_${Date.now()}_${Math.random().toString(36).substr(2, 9).toUpperCase()}`;
        redemptionResult = {
          type: 'discount_code',
          code: discountCode,
          value: reward.value,
          description: `${reward.value}% discount on next booking`
        };
        break;

      case 'cashback':
        // Process cashback (would integrate with payment provider)
        redemptionResult = {
          type: 'cashback',
          amount: reward.value,
          description: `₹${reward.value} cashback credited to wallet`
        };
        break;

      case 'free_service':
        // Grant free service
        redemptionResult = {
          type: 'free_service',
          service: reward.metadata?.service_type || 'parking',
          description: 'Free service booking unlocked'
        };
        break;

      case 'premium_feature':
        // Unlock premium feature
        redemptionResult = {
          type: 'premium_feature',
          feature: reward.metadata?.feature_name || 'premium',
          duration_days: reward.metadata?.duration_days || 30,
          description: `Premium feature unlocked for ${reward.metadata?.duration_days || 30} days`
        };
        break;

      default:
        redemptionResult = {
          type: 'custom',
          description: reward.description
        };
    }

    // Deduct points from user
    const { error: deductError } = await supabaseClient
      .from('user_stats')
      .update({
        total_points: userStats.total_points - reward.points_required,
        rewards_redeemed: userStats.rewards_redeemed + 1
      })
      .eq('user_id', user_id);

    if (deductError) {
      throw deductError;
    }

    // Record redemption
    const { data: redemptionRecord, error: redemptionError } = await supabaseClient
      .from('user_rewards')
      .insert({
        user_id: user_id,
        reward_id: reward_id,
        points_spent: reward.points_required,
        redemption_data: redemptionResult,
        redeemed_at: new Date().toISOString()
      })
      .select()
      .single();

    if (redemptionError) {
      throw redemptionError;
    }

    // Create notification for user
    await supabaseClient
      .from('notifications')
      .insert({
        user_id: user_id,
        type: 'reward_redemption',
        title: 'Reward Redeemed!',
        message: `You successfully redeemed "${reward.name}" for ${reward.points_required} points.`,
        metadata: {
          reward_id: reward_id,
          redemption_id: redemptionRecord.id,
          redemption_result: redemptionResult
        }
      });

    return new Response(
      JSON.stringify({
        success: true,
        redemption: redemptionRecord,
        new_balance: userStats.total_points - reward.points_required,
        reward_details: redemptionResult
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in reward-redemption:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
