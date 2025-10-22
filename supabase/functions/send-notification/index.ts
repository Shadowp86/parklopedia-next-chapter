import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface NotificationRequest {
  userId: string;
  type: 'DOCUMENT_EXPIRY' | 'BOOKING_CONFIRMATION' | 'BOOKING_REMINDER' | 'PAYMENT' | 'CHALLAN' | 'PROMOTIONAL';
  title: string;
  message: string;
  relatedId?: string;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const { userId, type, title, message, relatedId }: NotificationRequest = await req.json();

    if (!userId || !type || !title || !message) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Insert notification into database
    const { data, error } = await supabase
      .from('notifications')
      .insert({
        user_id: userId,
        type,
        title,
        message,
        related_id: relatedId || null,
        is_read: false,
      })
      .select()
      .single();

    if (error) throw error;

    console.log(`Notification created for user ${userId}:`, data);

    // Here you can add additional notification channels:
    // - Push notifications
    // - Email notifications
    // - SMS notifications

    return new Response(
      JSON.stringify({
        success: true,
        notification: data,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
