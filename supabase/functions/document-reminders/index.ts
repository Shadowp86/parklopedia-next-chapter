import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { corsHeaders, handleCors } from '../_shared/cors.ts';
import { supabase } from '../_shared/supabase.ts';

serve(async (req) => {
  // Handle CORS
  const corsResponse = handleCors(req);
  if (corsResponse) return corsResponse;

  try {
    // Get documents expiring in the next 30 days
    const thirtyDaysFromNow = new Date();
    thirtyDaysFromNow.setDate(thirtyDaysFromNow.getDate() + 30);

    const { data: expiringDocuments, error: documentsError } = await supabase
      .from('documents')
      .select(`
        id,
        user_id,
        document_type,
        expiry_date,
        users!inner(email, full_name)
      `)
      .eq('status', 'expiring_soon')
      .lte('expiry_date', thirtyDaysFromNow.toISOString().split('T')[0]);

    if (documentsError) {
      throw documentsError;
    }

    // Get expired documents
    const { data: expiredDocuments, error: expiredError } = await supabase
      .from('documents')
      .select(`
        id,
        user_id,
        document_type,
        expiry_date,
        users!inner(email, full_name)
      `)
      .eq('status', 'expired');

    if (expiredError) {
      throw expiredError;
    }

    // Create notifications for expiring documents
    const expiringNotifications = expiringDocuments?.map(doc => ({
      user_id: doc.user_id,
      title: 'Document Expiring Soon',
      message: `Your ${doc.document_type} document expires on ${doc.expiry_date}. Please renew it soon.`,
      notification_type: 'reminder',
      priority: 'high',
      action_url: '/documents',
      metadata: {
        document_id: doc.id,
        document_type: doc.document_type,
        expiry_date: doc.expiry_date
      }
    })) || [];

    // Create notifications for expired documents
    const expiredNotifications = expiredDocuments?.map(doc => ({
      user_id: doc.user_id,
      title: 'Document Expired',
      message: `Your ${doc.document_type} document has expired on ${doc.expiry_date}. Please renew it immediately.`,
      notification_type: 'alert',
      priority: 'urgent',
      action_url: '/documents',
      metadata: {
        document_id: doc.id,
        document_type: doc.document_type,
        expiry_date: doc.expiry_date
      }
    })) || [];

    const allNotifications = [...expiringNotifications, ...expiredNotifications];

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
        message: `Created ${allNotifications.length} document reminder notifications`,
        expiring: expiringNotifications.length,
        expired: expiredNotifications.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      }
    );

  } catch (error) {
    console.error('Error in document-reminders function:', error);

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
