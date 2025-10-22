import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

serve(async (req) => {
  try {
    console.log('Starting document expiry check...');

    // Get documents expiring in the next 15 days
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 15);

    const { data: expiringDocuments, error: docsError } = await supabase
      .from('documents')
      .select(`
        *,
        vehicles!inner(
          user_id,
          make,
          model,
          registration_number
        )
      `)
      .lte('expiry_date', futureDate.toISOString())
      .eq('reminder_sent', false);

    if (docsError) throw docsError;

    console.log(`Found ${expiringDocuments?.length || 0} expiring documents`);

    if (!expiringDocuments || expiringDocuments.length === 0) {
      return new Response(
        JSON.stringify({ message: 'No expiring documents found' }),
        { headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create notifications for each expiring document
    const notifications = expiringDocuments.map((doc: any) => {
      const expiryDate = new Date(doc.expiry_date);
      const daysUntilExpiry = Math.ceil(
        (expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)
      );

      return {
        user_id: doc.vehicles.user_id,
        type: 'DOCUMENT_EXPIRY',
        title: `${doc.document_type} Expiring Soon`,
        message: `Your ${doc.document_type} for ${doc.vehicles.make} ${doc.vehicles.model} (${doc.vehicles.registration_number}) will expire in ${daysUntilExpiry} days.`,
        related_id: doc.id,
        is_read: false,
      };
    });

    // Insert notifications
    const { error: notifError } = await supabase
      .from('notifications')
      .insert(notifications);

    if (notifError) throw notifError;

    // Mark documents as reminder sent
    const documentIds = expiringDocuments.map((doc: any) => doc.id);
    const { error: updateError } = await supabase
      .from('documents')
      .update({ reminder_sent: true })
      .in('id', documentIds);

    if (updateError) throw updateError;

    console.log(`Created ${notifications.length} notifications`);

    return new Response(
      JSON.stringify({
        success: true,
        notificationsSent: notifications.length,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(
      JSON.stringify({ error: message }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
});
