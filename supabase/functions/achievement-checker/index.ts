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

    // Get user stats
    const { data: userStats, error: statsError } = await supabaseClient
      .from('user_stats')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (statsError) {
      throw statsError;
    }

    // Define achievements
    const achievements = [
      {
        id: 'first_vehicle',
        name: 'First Ride',
        description: 'Add your first vehicle',
        icon: '🚗',
        condition: async () => {
          const { count } = await supabaseClient
            .from('vehicles')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id);
          return count! >= 1;
        },
        points: 50
      },
      {
        id: 'document_master',
        name: 'Document Master',
        description: 'Upload 5 vehicle documents',
        icon: '📄',
        condition: async () => {
          const { count } = await supabaseClient
            .from('documents')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id);
          return count! >= 5;
        },
        points: 100
      },
      {
        id: 'booking_streak',
        name: 'Regular Parker',
        description: 'Make 10 parking bookings',
        icon: '🅿️',
        condition: async () => {
          const { count } = await supabaseClient
            .from('bookings')
            .select('*', { count: 'exact', head: true })
            .eq('user_id', user_id)
            .eq('booking_type', 'parking');
          return count! >= 10;
        },
        points: 150
      },
      {
        id: 'streak_master',
        name: 'Streak Master',
        description: 'Maintain a 7-day usage streak',
        icon: '🔥',
        condition: () => userStats.current_streak >= 7,
        points: 200
      },
      {
        id: 'family_sharer',
        name: 'Family Coordinator',
        description: 'Create a family group and share vehicles',
        icon: '👨‍👩‍👧‍👦',
        condition: async () => {
          const { count } = await supabaseClient
            .from('family_groups')
            .select('*', { count: 'exact', head: true })
            .eq('owner_id', user_id);
          return count! >= 1;
        },
        points: 250
      },
      {
        id: 'point_collector',
        name: 'Point Collector',
        description: 'Earn 1000 total points',
        icon: '⭐',
        condition: () => userStats.total_points >= 1000,
        points: 300
      }
    ];

    // Check for new achievements
    const newAchievements = [];

    for (const achievement of achievements) {
      // Check if already unlocked
      const { data: existing } = await supabaseClient
        .from('achievements')
        .select('id')
        .eq('user_id', user_id)
        .eq('achievement_id', achievement.id)
        .single();

      if (existing) continue;

      // Check condition
      const conditionMet = await achievement.condition();

      if (conditionMet) {
        // Unlock achievement
        const { data: newAchievement, error: insertError } = await supabaseClient
          .from('achievements')
          .insert({
            user_id: user_id,
            achievement_id: achievement.id,
            name: achievement.name,
            description: achievement.description,
            icon: achievement.icon,
            points_awarded: achievement.points
          })
          .select()
          .single();

        if (insertError) {
          console.error('Error inserting achievement:', insertError);
          continue;
        }

        // Award points
        await supabaseClient
          .from('rewards')
          .insert({
            user_id: user_id,
            points_awarded: achievement.points,
            action_type: 'achievement_unlocked',
            metadata: { achievement_id: achievement.id }
          });

        // Update user stats
        await supabaseClient
          .from('user_stats')
          .update({
            total_points: userStats.total_points + achievement.points,
            achievements_unlocked: userStats.achievements_unlocked + 1
          })
          .eq('user_id', user_id);

        newAchievements.push(newAchievement);
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        new_achievements: newAchievements,
        total_unlocked: newAchievements.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in achievement-checker:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
