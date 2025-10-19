import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface AlertCheckRequest {
  vehicle_id?: string
  alert_type?: string
  check_all?: boolean
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vehicle_id, alert_type, check_all = false }: AlertCheckRequest = await req.json()

    let query = supabase
      .from('vehicle_alerts')
      .select(`
        id,
        user_id,
        vehicle_id,
        alert_type,
        threshold_value,
        is_active,
        last_triggered,
        vehicles_catalog (
          id,
          brand,
          model,
          vehicle_variants (
            id,
            variant_name,
            price_range_min,
            price_range_max
          )
        )
      `)
      .eq('is_active', true)

    if (!check_all) {
      if (vehicle_id) {
        query = query.eq('vehicle_id', vehicle_id)
      }
      if (alert_type) {
        query = query.eq('alert_type', alert_type)
      }
    }

    const { data: alerts, error } = await query

    if (error) {
      throw error
    }

    const triggeredAlerts = []
    const notifications = []

    for (const alert of alerts || []) {
      const vehicleData: any = alert.vehicles_catalog
      if (!vehicleData) continue
      
      const vehicle = Array.isArray(vehicleData) ? vehicleData[0] : vehicleData
      if (!vehicle) continue

      const variants = vehicle.vehicle_variants || []
      let shouldTrigger = false
      let triggerReason = ''

      switch (alert.alert_type) {
        case 'price_drop':
          if (alert.threshold_value && variants.length > 0) {
            const currentMinPrice = Math.min(...variants.map((v: any) => v.price_range_min || 0))
            if (currentMinPrice <= alert.threshold_value) {
              shouldTrigger = true
              triggerReason = `Price dropped to ₹${currentMinPrice.toLocaleString()} (below ₹${alert.threshold_value.toLocaleString()})`
            }
          }
          break

        case 'new_variant':
          // Check if new variants were added since last trigger
          if (alert.last_triggered) {
            const newVariants = variants.filter((v: any) =>
              v.created_at && new Date(v.created_at) > new Date(alert.last_triggered)
            )
            if (newVariants.length > 0) {
              shouldTrigger = true
              triggerReason = `${newVariants.length} new variant(s) added`
            }
          }
          break

        case 'launch_date':
          if (vehicle.launch_date && new Date(vehicle.launch_date) <= new Date()) {
            shouldTrigger = true
            triggerReason = `Vehicle launched on ${new Date(vehicle.launch_date).toLocaleDateString()}`
          }
          break

        case 'discontinued':
          if (vehicle.status === 'discontinued') {
            shouldTrigger = true
            triggerReason = 'Vehicle has been discontinued'
          }
          break
      }

      if (shouldTrigger) {
        triggeredAlerts.push(alert.id)

        // Create notification
        const notification = {
          user_id: alert.user_id,
          type: 'vehicle_alert',
          title: `${vehicle.brand} ${vehicle.model} Alert`,
          message: triggerReason,
          data: {
            vehicle_id: vehicle.id,
            alert_id: alert.id,
            alert_type: alert.alert_type
          },
          read: false,
          created_at: new Date().toISOString()
        }

        notifications.push(notification)

        // Update last_triggered timestamp
        await supabase
          .from('vehicle_alerts')
          .update({ last_triggered: new Date().toISOString() })
          .eq('id', alert.id)
      }
    }

    // Insert notifications in batch
    if (notifications.length > 0) {
      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error inserting notifications:', notificationError)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        triggered_alerts: triggeredAlerts.length,
        notifications_sent: notifications.length,
        alerts_checked: alerts?.length || 0
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in vehicle-alerts-dispatcher:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
