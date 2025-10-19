import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface CompareRequest {
  vehicle_ids: string[]
  user_id?: string // Optional for anonymous comparisons
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { vehicle_ids, user_id }: CompareRequest = await req.json()

    if (!vehicle_ids || vehicle_ids.length < 2 || vehicle_ids.length > 3) {
      return new Response(
        JSON.stringify({ error: 'Must provide 2-3 vehicle IDs for comparison' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 400,
        },
      )
    }

    // Fetch vehicle details with variants and reviews
    const { data: vehicles, error: vehiclesError } = await supabase
      .from('vehicles_catalog')
      .select(`
        id, brand, model, category, body_type, fuel_type, status, launch_date,
        vehicle_variants (
          id, variant_name, price_range_min, price_range_max, currency,
          engine_type, engine_displacement, power_hp, torque_nm, transmission,
          fuel_efficiency_city, fuel_efficiency_highway, fuel_efficiency_combined,
          electric_range, length_mm, width_mm, height_mm, wheelbase_mm,
          ground_clearance_mm, boot_space_liters, top_speed_kmph,
          acceleration_0_100, features, colors
        ),
        vehicle_reviews (
          rating, verified_purchase
        )
      `)
      .in('id', vehicle_ids)

    if (vehiclesError) {
      throw vehiclesError
    }

    if (!vehicles || vehicles.length !== vehicle_ids.length) {
      return new Response(
        JSON.stringify({ error: 'One or more vehicles not found' }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 404,
        },
      )
    }

    // Enrich vehicles with calculated metrics
    const enrichedVehicles = vehicles.map(vehicle => {
      const reviews = vehicle.vehicle_reviews || []
      const verifiedReviews = reviews.filter(r => r.verified_purchase)
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : null
      const verifiedAvgRating = verifiedReviews.length > 0
        ? verifiedReviews.reduce((sum, review) => sum + review.rating, 0) / verifiedReviews.length
        : null

      const variants = vehicle.vehicle_variants || []
      const priceRange = variants.length > 0 ? {
        min: Math.min(...variants.map(v => v.price_range_min || 0)),
        max: Math.max(...variants.map(v => v.price_range_max || 0)),
        currency: variants[0]?.currency || 'INR'
      } : null

      // Calculate best/worst specs for comparison
      const specs = {
        best: {
          fuel_efficiency: variants.length > 0 ? Math.max(...variants.map(v => v.fuel_efficiency_combined || 0)) : null,
          power: variants.length > 0 ? Math.max(...variants.map(v => v.power_hp || 0)) : null,
          boot_space: variants.length > 0 ? Math.max(...variants.map(v => v.boot_space_liters || 0)) : null,
          ground_clearance: variants.length > 0 ? Math.max(...variants.map(v => v.ground_clearance_mm || 0)) : null,
        },
        base: {
          fuel_efficiency: variants.length > 0 ? Math.min(...variants.map(v => v.fuel_efficiency_combined || 0)) : null,
          power: variants.length > 0 ? Math.min(...variants.map(v => v.power_hp || 0)) : null,
          boot_space: variants.length > 0 ? Math.min(...variants.map(v => v.boot_space_liters || 0)) : null,
          ground_clearance: variants.length > 0 ? Math.min(...variants.map(v => v.ground_clearance_mm || 0)) : null,
        }
      }

      return {
        ...vehicle,
        stats: {
          total_reviews: reviews.length,
          verified_reviews: verifiedReviews.length,
          average_rating: avgRating,
          verified_average_rating: verifiedAvgRating,
          variants_count: variants.length
        },
        price_range: priceRange,
        specs_comparison: specs
      }
    })

    // Save comparison history if user is authenticated
    if (user_id) {
      await supabase
        .from('vehicle_comparisons')
        .insert({
          user_id,
          vehicle_ids: vehicle_ids.map(id => id),
          comparison_criteria: ['price', 'specs', 'features', 'reviews']
        })
        .select()
        .single()
    }

    // Generate comparison insights
    const comparisonInsights = generateComparisonInsights(enrichedVehicles)

    return new Response(
      JSON.stringify({
        vehicles: enrichedVehicles,
        insights: comparisonInsights,
        comparison_id: user_id ? 'saved' : 'anonymous'
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in compare-vehicles:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

function generateComparisonInsights(vehicles: any[]) {
  const insights = {
    price_difference: null as any,
    best_values: {} as any,
    recommendations: [] as string[]
  }

  if (vehicles.length >= 2) {
    // Price comparison
    const prices = vehicles.map(v => v.price_range?.min).filter(p => p)
    if (prices.length >= 2) {
      const minPrice = Math.min(...prices)
      const maxPrice = Math.max(...prices)
      insights.price_difference = {
        range: maxPrice - minPrice,
        percentage: ((maxPrice - minPrice) / minPrice * 100).toFixed(1)
      }
    }

    // Best values identification
    const metrics = ['fuel_efficiency', 'power', 'boot_space', 'ground_clearance']
    metrics.forEach(metric => {
      const values = vehicles.map(v => v.specs_comparison?.best?.[metric]).filter(v => v)
      if (values.length > 0) {
        const bestValue = Math.max(...values)
        const bestVehicle = vehicles.find(v => v.specs_comparison?.best?.[metric] === bestValue)
        insights.best_values[metric] = {
          value: bestValue,
          vehicle: `${bestVehicle.brand} ${bestVehicle.model}`
        }
      }
    })

    // Generate recommendations
    const recommendations = []

    // Price vs features recommendation
    const cheapest = vehicles.reduce((prev, current) =>
      (prev.price_range?.min < current.price_range?.min) ? prev : current
    )
    const bestRated = vehicles.reduce((prev, current) =>
      ((prev.stats?.average_rating || 0) > (current.stats?.average_rating || 0)) ? prev : current
    )

    if (cheapest.id !== bestRated.id) {
      recommendations.push(`Consider ${cheapest.brand} ${cheapest.model} for budget-conscious buyers or ${bestRated.brand} ${bestRated.model} for premium features.`)
    }

    // Fuel efficiency recommendation
    const mostEfficient = vehicles.reduce((prev, current) =>
      ((prev.specs_comparison?.best?.fuel_efficiency || 0) > (current.specs_comparison?.best?.fuel_efficiency || 0)) ? prev : current
    )
    if (mostEfficient.specs_comparison?.best?.fuel_efficiency > 15) {
      recommendations.push(`${mostEfficient.brand} ${mostEfficient.model} offers excellent fuel efficiency, ideal for daily commuting.`)
    }

    insights.recommendations = recommendations
  }

  return insights
}
