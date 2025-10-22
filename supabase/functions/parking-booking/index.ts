import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';
import { corsHeaders, handleCors } from '../_shared/cors.ts';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

interface BookingRequest {
  userId: string;
  vehicleId: string;
  spotId: string;
  bookingDate: string;
  startTime: string;
  duration: number;
  totalAmount: number;
}

serve(async (req) => {
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    const bookingData: BookingRequest = await req.json();
    
    console.log('Creating parking booking:', bookingData);

    // Check if spot is available
    const { data: spot, error: spotError } = await supabase
      .from('parking_spots')
      .select('available_spots, total_spots, is_active')
      .eq('id', bookingData.spotId)
      .single();

    if (spotError) throw spotError;

    if (!spot.is_active || spot.available_spots <= 0) {
      return new Response(
        JSON.stringify({ error: 'Parking spot is not available' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Calculate end time
    const startDateTime = new Date(`${bookingData.bookingDate}T${bookingData.startTime}`);
    const endDateTime = new Date(startDateTime.getTime() + bookingData.duration * 60 * 60 * 1000);
    const endTime = endDateTime.toTimeString().slice(0, 5);

    // Create booking
    const { data: booking, error: bookingError } = await supabase
      .from('parking_bookings')
      .insert({
        user_id: bookingData.userId,
        vehicle_id: bookingData.vehicleId,
        spot_id: bookingData.spotId,
        booking_date: bookingData.bookingDate,
        start_time: bookingData.startTime,
        end_time: endTime,
        status: 'CONFIRMED',
        total_amount: bookingData.totalAmount,
      })
      .select()
      .single();

    if (bookingError) throw bookingError;

    // Update available spots
    const { error: updateError } = await supabase
      .from('parking_spots')
      .update({ available_spots: spot.available_spots - 1 })
      .eq('id', bookingData.spotId);

    if (updateError) throw updateError;

    // Create notification
    await supabase.from('notifications').insert({
      user_id: bookingData.userId,
      type: 'BOOKING_CONFIRMATION',
      title: 'Parking Booked Successfully',
      message: `Your parking spot has been confirmed for ${bookingData.bookingDate} at ${bookingData.startTime}`,
      related_id: booking.id,
      is_read: false,
    });

    console.log('Booking created successfully:', booking);

    return new Response(
      JSON.stringify({
        success: true,
        booking,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error creating booking:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
