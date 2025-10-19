import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { supabase } from '../_shared/supabase.ts';

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  if (req.method !== 'POST') {
    return new Response('Method not allowed', {
      status: 405,
      headers: corsHeaders
    });
  }

  try {
    const { booking_id, payment_method_id, amount } = await req.json();

    if (!booking_id || !payment_method_id || !amount) {
      return new Response(
        JSON.stringify({ error: 'Missing required fields: booking_id, payment_method_id, amount' }),
        {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    // Get booking details
    const { data: booking, error: bookingError } = await supabase
      .from('bookings')
      .select('*, users!inner(email, full_name)')
      .eq('id', booking_id)
      .single();

    if (bookingError || !booking) {
      throw new Error('Booking not found');
    }

    // Get payment method details
    const { data: paymentMethod, error: paymentMethodError } = await supabase
      .from('payment_methods')
      .select('*')
      .eq('id', payment_method_id)
      .eq('user_id', booking.user_id)
      .single();

    if (paymentMethodError || !paymentMethod) {
      throw new Error('Payment method not found or does not belong to user');
    }

    // Simulate payment processing (in production, integrate with actual payment gateway)
    const transactionId = `txn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const { data: payment, error: paymentError } = await supabase
      .from('payments')
      .insert({
        user_id: booking.user_id,
        booking_id: booking_id,
        amount: amount,
        currency: 'INR',
        payment_method: paymentMethod.method_type,
        payment_gateway: 'mock_gateway', // Replace with actual gateway
        transaction_id: transactionId,
        status: 'completed', // In production, this would be 'pending' until confirmed
        metadata: {
          payment_method_id: payment_method_id,
          processed_at: new Date().toISOString()
        }
      })
      .select()
      .single();

    if (paymentError) {
      throw paymentError;
    }

    // Update booking status
    const { error: updateError } = await supabase
      .from('bookings')
      .update({
        status: 'confirmed',
        updated_at: new Date().toISOString()
      })
      .eq('id', booking_id);

    if (updateError) {
      throw updateError;
    }

    // Create success notification
    const { error: notificationError } = await supabase
      .from('notifications')
      .insert({
        user_id: booking.user_id,
        title: 'Payment Successful',
        message: `Your payment of ₹${amount} for ${booking.booking_type} booking has been processed successfully.`,
        notification_type: 'payment',
        priority: 'normal',
        action_url: `/bookings/${booking_id}`,
        metadata: {
          booking_id: booking_id,
          payment_id: payment.id,
          amount: amount
        }
      });

    if (notificationError) {
      console.error('Failed to create payment notification:', notificationError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        payment: payment,
        message: 'Payment processed successfully'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in payment-processor function:', error);

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
