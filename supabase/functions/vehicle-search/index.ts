import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

interface SearchRequest {
  query?: string
  filters?: {
    brand?: string[]
    category?: string[]
    fuel_type?: string[]
    price_min?: number
    price_max?: number
    body_type?: string[]
    status?: string[]
  }
  sort_by?: 'relevance' | 'price_low' | 'price_high' | 'rating' | 'newest'
  limit?: number
  offset?: number
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { query, filters = {}, sort_by = 'relevance', limit = 20, offset = 0 }: SearchRequest = await req.json()

    let queryBuilder = supabase
      .from('vehicles_catalog')
      .select(`
        id, brand, model, category, body_type, fuel_type, status, launch_date,
        vehicle_variants (
          id, variant_name, price_range_min, price_range_max,
          fuel_efficiency_combined, engine_type, power_hp, transmission
        ),
        vehicle_reviews (
          rating
        )
      `)

    // Apply text search if query provided
    if (query && query.trim()) {
      // Use full-text search for exact matches and fuzzy matching
      queryBuilder = queryBuilder.or(`brand.ilike.%${query}%,model.ilike.%${query}%,category.ilike.%${query}%`)

      // Also use trigram similarity for fuzzy matching
      queryBuilder = queryBuilder.or(`brand.%${query}%,model.%${query}%`, { foreignTable: undefined })
    }

    // Apply filters
    if (filters.brand?.length) {
      queryBuilder = queryBuilder.in('brand', filters.brand)
    }

    if (filters.category?.length) {
      queryBuilder = queryBuilder.in('category', filters.category)
    }

    if (filters.fuel_type?.length) {
      queryBuilder = queryBuilder.in('fuel_type', filters.fuel_type)
    }

    if (filters.body_type?.length) {
      queryBuilder = queryBuilder.in('body_type', filters.body_type)
    }

    if (filters.status?.length) {
      queryBuilder = queryBuilder.in('status', filters.status)
    }

    // Price range filter (join with variants)
    if (filters.price_min !== undefined || filters.price_max !== undefined) {
      queryBuilder = queryBuilder
        .gte('vehicle_variants.price_range_min', filters.price_min || 0)
        .lte('vehicle_variants.price_range_max', filters.price_max || 100000000)
    }

    // Apply sorting
    switch (sort_by) {
      case 'price_low':
        queryBuilder = queryBuilder.order('vehicle_variants.price_range_min', { ascending: true })
        break
      case 'price_high':
        queryBuilder = queryBuilder.order('vehicle_variants.price_range_max', { ascending: false })
        break
      case 'newest':
        queryBuilder = queryBuilder.order('launch_date', { ascending: false })
        break
      case 'rating':
        // This would require a more complex query with aggregations
        queryBuilder = queryBuilder.order('vehicle_reviews.rating', { ascending: false })
        break
      default: // relevance
        if (query) {
          // Use similarity for relevance sorting
          queryBuilder = queryBuilder.order('search_vector', { ascending: false })
        } else {
          queryBuilder = queryBuilder.order('brand', { ascending: true })
        }
    }

    // Apply pagination
    queryBuilder = queryBuilder.range(offset, offset + limit - 1)

    const { data: vehicles, error, count } = await queryBuilder

    if (error) {
      throw error
    }

    // Calculate average ratings and enrich data
    const enrichedVehicles = vehicles?.map(vehicle => {
      const reviews = vehicle.vehicle_reviews || []
      const avgRating = reviews.length > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / reviews.length
        : null

      const variants = vehicle.vehicle_variants || []
      const priceRange = variants.length > 0 ? {
        min: Math.min(...variants.map(v => v.price_range_min || 0)),
        max: Math.max(...variants.map(v => v.price_range_max || 0))
      } : null

      return {
        ...vehicle,
        average_rating: avgRating,
        review_count: reviews.length,
        price_range: priceRange,
        variants_count: variants.length
      }
    }) || []

    return new Response(
      JSON.stringify({
        vehicles: enrichedVehicles,
        total_count: count,
        has_more: (offset + limit) < (count || 0),
        query,
        filters
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in vehicle-search:', error)
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Unknown error' }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})
