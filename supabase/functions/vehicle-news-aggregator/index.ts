import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { corsHeaders } from '../_shared/cors.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const supabaseUrl = Deno.env.get('SUPABASE_URL')!
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
const supabase = createClient(supabaseUrl, supabaseServiceKey)

// RSS feed sources for automotive news
const RSS_SOURCES = [
  {
    name: 'Autocar India',
    url: 'https://www.autocarindia.com/rss/news',
    category: 'news'
  },
  {
    name: 'CarDekho',
    url: 'https://www.cardekho.com/rss',
    category: 'news'
  },
  {
    name: 'ZigWheels',
    url: 'https://www.zigwheels.com/rss/news',
    category: 'news'
  },
  // Add more sources as needed
]

interface NewsArticle {
  title: string
  summary: string
  content: string
  source_url: string
  source_name: string
  published_at: string
  image_url?: string
  categories: string[]
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Fetch news from RSS feeds
    const allArticles: NewsArticle[] = []

    for (const source of RSS_SOURCES) {
      try {
        const articles = await fetchRSSFeed(source)
        allArticles.push(...articles)
      } catch (error) {
        console.error(`Error fetching from ${source.name}:`, error)
      }
    }

    // Process and store articles
    const processedArticles = []
    const skippedArticles = []

    for (const article of allArticles) {
      // Check if article already exists
      const { data: existing } = await supabase
        .from('vehicle_news')
        .select('id')
        .eq('source_url', article.source_url)
        .single()

      if (existing) {
        skippedArticles.push(article.title)
        continue
      }

      // Generate AI summary and tags (placeholder - would integrate with OpenAI)
      const aiSummary = await generateAISummary(article.content || article.summary)
      const aiTags = await generateAITags(article.title + ' ' + article.summary)

      // Identify related vehicles (placeholder - would use AI/ML)
      const relatedVehicles = await findRelatedVehicles(article.title + ' ' + article.summary)

      const newsData = {
        title: article.title,
        summary: article.summary,
        content: article.content,
        source_url: article.source_url,
        source_name: article.source_name,
        published_at: article.published_at,
        image_url: article.image_url,
        ai_summary: aiSummary,
        ai_tags: aiTags,
        categories: article.categories,
        related_vehicles: relatedVehicles,
        view_count: 0,
        like_count: 0
      }

      const { data, error } = await supabase
        .from('vehicle_news')
        .insert(newsData)
        .select()
        .single()

      if (error) {
        console.error('Error inserting article:', error)
      } else {
        processedArticles.push(data)
      }
    }

    return new Response(
      JSON.stringify({
        success: true,
        articles_processed: processedArticles.length,
        articles_skipped: skippedArticles.length,
        total_fetched: allArticles.length,
        sources_checked: RSS_SOURCES.length
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200,
      },
    )

  } catch (error) {
    console.error('Error in vehicle-news-aggregator:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 500,
      },
    )
  }
})

async function fetchRSSFeed(source: { name: string; url: string; category: string }): Promise<NewsArticle[]> {
  try {
    const response = await fetch(source.url)
    const xmlText = await response.text()

    // Parse XML (simplified - in production, use a proper XML parser)
    const articles: NewsArticle[] = []

    // This is a simplified XML parsing - in production, use xml2js or similar
    const itemMatches = xmlText.match(/<item>[\s\S]*?<\/item>/g) || []

    for (const itemMatch of itemMatches.slice(0, 10)) { // Limit to 10 articles per source
      const title = extractXMLValue(itemMatch, 'title')
      const description = extractXMLValue(itemMatch, 'description')
      const link = extractXMLValue(itemMatch, 'link')
      const pubDate = extractXMLValue(itemMatch, 'pubDate')

      if (title && link) {
        articles.push({
          title: cleanHTML(title),
          summary: cleanHTML(description || '').substring(0, 500),
          content: cleanHTML(description || ''),
          source_url: link,
          source_name: source.name,
          published_at: pubDate ? new Date(pubDate).toISOString() : new Date().toISOString(),
          categories: [source.category, 'automotive']
        })
      }
    }

    return articles
  } catch (error) {
    console.error(`Error fetching RSS from ${source.name}:`, error)
    return []
  }
}

function extractXMLValue(xml: string, tag: string): string | null {
  const regex = new RegExp(`<${tag}[^>]*>([\\s\\S]*?)</${tag}>`, 'i')
  const match = xml.match(regex)
  return match ? match[1] : null
}

function cleanHTML(text: string): string {
  // Remove HTML tags and decode entities
  return text
    .replace(/<[^>]*>/g, '')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/</g, '<')
    .replace(/>/g, '>')
    .replace(/"/g, '"')
    .replace(/&#39;/g, "'")
    .trim()
}

// Placeholder functions for AI integration
async function generateAISummary(content: string): Promise<string> {
  // In production, integrate with OpenAI API
  // For now, return a truncated version
  return content.length > 200 ? content.substring(0, 200) + '...' : content
}

async function generateAITags(text: string): Promise<string[]> {
  // In production, use AI to extract relevant tags
  // For now, return some basic tags
  const tags = []
  const lowerText = text.toLowerCase()

  if (lowerText.includes('electric') || lowerText.includes('ev')) tags.push('electric')
  if (lowerText.includes('suv')) tags.push('suv')
  if (lowerText.includes('sedan')) tags.push('sedan')
  if (lowerText.includes('hatchback')) tags.push('hatchback')
  if (lowerText.includes('launch')) tags.push('launch')
  if (lowerText.includes('price')) tags.push('pricing')

  return tags.length > 0 ? tags : ['automotive']
}

async function findRelatedVehicles(text: string): Promise<string[]> {
  // In production, use AI/ML to match articles with vehicles
  // For now, search for known vehicle names
  const vehicleNames = [
    'tata', 'mahindra', 'maruti', 'hyundai', 'honda', 'toyota',
    'ford', 'chevrolet', 'nissan', 'renault', 'kia', 'mg'
  ]

  const lowerText = text.toLowerCase()
  const related: string[] = []

  for (const name of vehicleNames) {
    if (lowerText.includes(name)) {
      // Query database for actual vehicle IDs
      const { data: vehicles } = await supabase
        .from('vehicles_catalog')
        .select('id')
        .ilike('brand', `%${name}%`)
        .limit(3)

      if (vehicles) {
        related.push(...vehicles.map(v => v.id))
      }
    }
  }

  return [...new Set(related)] // Remove duplicates
}
