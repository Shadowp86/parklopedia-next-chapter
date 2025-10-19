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

    const { action, user_id, referral_code, referrer_id } = await req.json();

    if (!user_id) {
      throw new Error('User ID is required');
    }

    switch (action) {
      case 'generate_code': {
        // Generate unique referral code
        const referralCode = `PARK${Date.now().toString(36).toUpperCase()}${Math.random().toString(36).substr(2, 4).toUpperCase()}`;

        const { data: existingCode } = await supabaseClient
          .from('user_referrals')
          .select('id')
          .eq('user_id', user_id)
          .single();

        if (existingCode) {
          // Update existing code
          const { error: updateError } = await supabaseClient
            .from('user_referrals')
            .update({ referral_code: referralCode, updated_at: new Date().toISOString() })
            .eq('user_id', user_id);

          if (updateError) throw updateError;
        } else {
          // Create new referral record
          const { error: insertError } = await supabaseClient
            .from('user_referrals')
            .insert({
              user_id: user_id,
              referral_code: referralCode
            });

          if (insertError) throw insertError;
        }

        return new Response(
          JSON.stringify({
            success: true,
            referral_code: referralCode
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'apply_referral': {
        if (!referral_code) {
          throw new Error('Referral code is required');
        }

        // Find referrer by code
        const { data: referrer } = await supabaseClient
          .from('user_referrals')
          .select('user_id')
          .eq('referral_code', referral_code)
          .single();

        if (!referrer) {
          throw new Error('Invalid referral code');
        }

        if (referrer.user_id === user_id) {
          throw new Error('Cannot use your own referral code');
        }

        // Check if user already used a referral
        const { data: existingReferral } = await supabaseClient
          .from('referral_uses')
          .select('id')
          .eq('referee_id', user_id)
          .single();

        if (existingReferral) {
          throw new Error('Referral code already used');
        }

        // Record referral use
        const { error: useError } = await supabaseClient
          .from('referral_uses')
          .insert({
            referrer_id: referrer.user_id,
            referee_id: user_id,
            referral_code: referral_code
          });

        if (useError) throw useError;

        // Award points to both users
        const referrerReward = await supabaseClient
          .from('rewards')
          .insert({
            user_id: referrer.user_id,
            points_awarded: 100,
            action_type: 'successful_referral',
            metadata: { referee_id: user_id }
          });

        const refereeReward = await supabaseClient
          .from('rewards')
          .insert({
            user_id: user_id,
            points_awarded: 50,
            action_type: 'referral_bonus',
            metadata: { referrer_id: referrer.user_id }
          });

        // Update user stats
        await supabaseClient
          .from('user_stats')
          .update({
            total_points: supabaseClient.functions.invoke('get_user_points', { body: { user_id: referrer.user_id } })
          })
          .eq('user_id', referrer.user_id);

        await supabaseClient
          .from('user_stats')
          .update({
            total_points: supabaseClient.functions.invoke('get_user_points', { body: { user_id: user_id } })
          })
          .eq('user_id', user_id);

        return new Response(
          JSON.stringify({
            success: true,
            message: 'Referral applied successfully! Both users received bonus points.',
            referrer_reward: 100,
            referee_reward: 50
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'get_referral_stats': {
        // Get user's referral statistics
        const { data: userReferral } = await supabaseClient
          .from('user_referrals')
          .select('referral_code, created_at')
          .eq('user_id', user_id)
          .single();

        const { count: referralCount } = await supabaseClient
          .from('referral_uses')
          .select('*', { count: 'exact', head: true })
          .eq('referrer_id', user_id);

        const { data: recentReferrals } = await supabaseClient
          .from('referral_uses')
          .select(`
            created_at,
            users!referral_uses_referee_id_fkey (
              full_name,
              avatar_url
            )
          `)
          .eq('referrer_id', user_id)
          .order('created_at', { ascending: false })
          .limit(5);

        return new Response(
          JSON.stringify({
            success: true,
            referral_code: userReferral?.referral_code,
            total_referrals: referralCount || 0,
            recent_referrals: recentReferrals || []
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      default:
        throw new Error('Invalid action');
    }

  } catch (error) {
    console.error('Error in referral-system:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
