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

    const { user_id } = await req.json();

    if (!user_id) {
      throw new Error('User ID is required');
    }

    // Get user's last activity
    const { data: lastActivity } = await supabaseClient
      .from('user_activity_log')
      .select('created_at')
      .eq('user_id', user_id)
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    // Get current user stats
    const { data: userStats, error: statsError } = await supabaseClient
      .from('user_stats')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (statsError) {
      throw statsError;
    }

    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    let currentStreak = userStats.current_streak || 0;
    let longestStreak = userStats.longest_streak || 0;

    if (lastActivity) {
      const lastActivityDate = new Date(lastActivity.created_at);
      const lastActivityDay = new Date(lastActivityDate.getFullYear(), lastActivityDate.getMonth(), lastActivityDate.getDate());

      const daysDifference = Math.floor((today.getTime() - lastActivityDay.getTime()) / (1000 * 60 * 60 * 24));

      if (daysDifference === 1) {
        // Consecutive day - increase streak
        currentStreak += 1;
      } else if (daysDifference > 1) {
        // Streak broken - reset to 1
        currentStreak = 1;
      }
      // If daysDifference === 0, it's the same day, keep current streak
    } else {
      // First activity - start streak at 1
      currentStreak = 1;
    }

    // Update longest streak if current is higher
    if (currentStreak > longestStreak) {
      longestStreak = currentStreak;
    }

    // Log today's activity
    await supabaseClient
      .from('user_activity_log')
      .insert({
        user_id: user_id,
        activity_type: 'daily_login',
        metadata: { streak_count: currentStreak }
      });

    // Update user stats
    const { error: updateError } = await supabaseClient
      .from('user_stats')
      .update({
        current_streak: currentStreak,
        longest_streak: longestStreak,
        last_activity_date: now.toISOString()
      })
      .eq('user_id', user_id);

    if (updateError) {
      throw updateError;
    }

    // Award streak bonus points
    if (currentStreak > 1 && currentStreak % 7 === 0) {
      // Weekly streak bonus
      await supabaseClient
        .from('rewards')
        .insert({
          user_id: user_id,
          points_awarded: 50,
          action_type: 'streak_bonus',
          metadata: { streak_count: currentStreak }
        });

      // Update total points
      await supabaseClient
        .from('user_stats')
        .update({
          total_points: userStats.total_points + 50
        })
        .eq('user_id', user_id);
    }

    return new Response(
      JSON.stringify({
        success: true,
        current_streak: currentStreak,
        longest_streak: longestStreak,
        streak_bonus_awarded: currentStreak > 1 && currentStreak % 7 === 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in streak-updater:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
