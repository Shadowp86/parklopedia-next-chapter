import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { supabase } from '../_shared/supabase.ts';

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get bookings that need notifications (starting within next 2 hours)
    const twoHoursFromNow = new Date();
    twoHoursFromNow.setHours(twoHoursFromNow.getHours() + 2);

    const { data: upcomingBookings, error: bookingsError } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        booking_type,
        start_time,
        status,
        users!inner(email, full_name)
      `)
      .eq('status', 'confirmed')
      .gte('start_time', new Date().toISOString())
      .lte('start_time', twoHoursFromNow.toISOString());

    if (bookingsError) {
      throw bookingsError;
    }

    // Get bookings that are starting now
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);

    const { data: startingBookings, error: startingError } = await supabase
      .from('bookings')
      .select(`
        id,
        user_id,
        booking_type,
        start_time,
        status,
        users!inner(email, full_name)
      `)
      .eq('status', 'confirmed')
      .gte('start_time', fiveMinutesAgo.toISOString())
      .lte('start_time', now.toISOString());

    if (startingError) {
      throw startingError;
    }

    // Create notifications for upcoming bookings
    const upcomingNotifications = upcomingBookings?.map(booking => ({
      user_id: booking.user_id,
      title: 'Upcoming Booking Reminder',
      message: `Your ${booking.booking_type} booking starts at ${new Date(booking.start_time).toLocaleString()}.`,
      notification_type: 'reminder',
      priority: 'normal',
      action_url: `/bookings/${booking.id}`,
      metadata: {
        booking_id: booking.id,
        booking_type: booking.booking_type,
        start_time: booking.start_time
      }
    })) || [];

    // Create notifications for starting bookings
    const startingNotifications = startingBookings?.map(booking => ({
      user_id: booking.user_id,
      title: 'Booking Starting Now',
      message: `Your ${booking.booking_type} booking is starting now.`,
      notification_type: 'reminder',
      priority: 'high',
      action_url: `/bookings/${booking.id}`,
      metadata: {
        booking_id: booking.id,
        booking_type: booking.booking_type,
        start_time: booking.start_time
      }
    })) || [];

    const allNotifications = [...upcomingNotifications, ...startingNotifications];

    // Insert notifications
    if (allNotifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(allNotifications);

      if (notificationError) {
        throw notificationError;
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Created ${allNotifications.length} booking notifications`,
        upcoming: upcomingNotifications.length,
        starting: startingNotifications.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in booking-notifications function:', error);

    return new Response(
      JSON.stringify({
        success: false,
        error: error.message
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      }
    );
  }
});
