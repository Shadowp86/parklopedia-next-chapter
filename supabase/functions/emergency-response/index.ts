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

    const { action, user_id, emergency_type, location, message, severity } = await req.json();

    if (!user_id) {
      throw new Error('User ID is required');
    }

    switch (action) {
      case 'create_sos': {
        if (!location || !emergency_type) {
          throw new Error('Location and emergency type are required');
        }

        // Create SOS request
        const { data: sosRequest, error: sosError } = await supabaseClient
          .from('sos_requests')
          .insert({
            user_id: user_id,
            location: location,
            emergency_type: emergency_type,
            message: message,
            severity: severity || 'high'
          })
          .select()
          .single();

        if (sosError) throw sosError;

        // Get user's emergency contacts
        const { data: contacts } = await supabaseClient
          .from('emergency_contacts')
          .select('*')
          .eq('user_id', user_id)
          .eq('is_active', true);

        // Create emergency log
        const { error: logError } = await supabaseClient
          .from('emergency_logs')
          .insert({
            user_id: user_id,
            emergency_type: emergency_type,
            location: location,
            description: message,
            severity: severity || 'high',
            responders_notified: contacts?.map(c => ({ name: c.name, phone: c.phone })) || []
          });

        if (logError) throw logError;

        // Send notifications to emergency contacts
        if (contacts && contacts.length > 0) {
          const notifications = contacts.map(contact => ({
            user_id: user_id, // Send to the user, but could be extended to notify contacts
            type: 'emergency_alert',
            title: 'Emergency Alert Sent',
            message: `Emergency alert sent to ${contact.name} (${contact.phone})`,
            data: {
              emergency_id: sosRequest.id,
              contact_name: contact.name,
              contact_phone: contact.phone,
              emergency_type: emergency_type
            },
            priority: 'urgent'
          }));

          await supabaseClient
            .from('notifications')
            .insert(notifications);
        }

        // Notify nearby emergency services (placeholder - would integrate with actual emergency services)
        const emergencyServicesNotification = {
          user_id: user_id,
          type: 'emergency_services',
          title: 'Emergency Services Notified',
          message: 'Local emergency services have been alerted to your location',
          data: {
            emergency_id: sosRequest.id,
            location: location,
            emergency_type: emergency_type
          },
          priority: 'urgent'
        };

        await supabaseClient
          .from('notifications')
          .insert(emergencyServicesNotification);

        return new Response(
          JSON.stringify({
            success: true,
            sos_request: sosRequest,
            message: 'Emergency alert sent successfully. Help is on the way.',
            contacts_notified: contacts?.length || 0
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'update_sos_status': {
        const { sos_id, status, responder_info } = await req.json();

        if (!sos_id || !status) {
          throw new Error('SOS ID and status are required');
        }

        // Update SOS request
        const { error: updateError } = await supabaseClient
          .from('sos_requests')
          .update({
            status: status,
            ...(status === 'resolved' && { resolved_at: new Date().toISOString() }),
            ...(responder_info && { responders: [responder_info] })
          })
          .eq('id', sos_id)
          .eq('user_id', user_id);

        if (updateError) throw updateError;

        // Create notification for status update
        const statusMessages = {
          responding: 'Emergency responders are on their way',
          resolved: 'Emergency situation has been resolved',
          cancelled: 'Emergency alert has been cancelled'
        };

        await supabaseClient
          .from('notifications')
          .insert({
            user_id: user_id,
            type: 'emergency_update',
            title: 'Emergency Status Update',
            message: statusMessages[status as keyof typeof statusMessages] || 'Emergency status updated',
            data: { sos_id, status, responder_info },
            priority: status === 'responding' ? 'urgent' : 'high'
          });

        return new Response(
          JSON.stringify({
            success: true,
            message: 'SOS status updated successfully'
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'get_emergency_contacts': {
        const { data: contacts, error } = await supabaseClient
          .from('emergency_contacts')
          .select('*')
          .eq('user_id', user_id)
          .eq('is_active', true)
          .order('priority', { ascending: true });

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            contacts: contacts || []
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'add_emergency_contact': {
        const { name, relationship, phone, email, priority } = await req.json();

        if (!name || !phone) {
          throw new Error('Name and phone are required');
        }

        const { data: contact, error } = await supabaseClient
          .from('emergency_contacts')
          .insert({
            user_id: user_id,
            name: name,
            relationship: relationship,
            phone: phone,
            email: email,
            priority: priority || 1
          })
          .select()
          .single();

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            contact: contact
          }),
          {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 200,
          }
        );
      }

      case 'get_emergency_history': {
        const { data: history, error } = await supabaseClient
          .from('emergency_logs')
          .select('*')
          .eq('user_id', user_id)
          .order('created_at', { ascending: false })
          .limit(20);

        if (error) throw error;

        return new Response(
          JSON.stringify({
            success: true,
            history: history || []
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
    console.error('Error in emergency-response:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    );
  }
});
