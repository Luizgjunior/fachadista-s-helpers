import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
}

const GG_API_BASE = 'https://www.ggcheckout.com/api'

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders })
  }

  try {
    // Auth: verify admin
    const authHeader = req.headers.get('Authorization')
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    )

    const token = authHeader.replace('Bearer ', '')
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token)
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: corsHeaders })
    }

    const userId = claimsData.claims.sub
    const { data: isAdmin } = await supabase.rpc('is_admin', { _user_id: userId })
    if (!isAdmin) {
      return new Response(JSON.stringify({ error: 'Forbidden' }), { status: 403, headers: corsHeaders })
    }

    const apiKey = Deno.env.get('GGCHECKOUT_API_KEY')
    if (!apiKey) {
      return new Response(JSON.stringify({ error: 'GGCHECKOUT_API_KEY not configured' }), { status: 500, headers: corsHeaders })
    }

    const ggHeaders: Record<string, string> = {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'NewR-Admin/1.0',
    }

    const { action, params } = await req.json()

    const fetchGG = async (url: string) => {
      const res = await fetch(url, { headers: ggHeaders })
      const text = await res.text()
      
      // Check if response is HTML (Cloudflare/Vercel protection)
      if (text.startsWith('<!DOCTYPE') || text.startsWith('<html')) {
        throw new Error('API_BLOCKED: ggCheckout API is behind bot protection and cannot be accessed from server. Use the local data view instead.')
      }
      
      if (!res.ok) {
        throw new Error(`ggCheckout API error [${res.status}]: ${text}`)
      }
      
      return JSON.parse(text)
    }

    if (action === 'get_business') {
      const data = await fetchGG(`${GG_API_BASE}/me`)
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    if (action === 'list_payments') {
      const meData = await fetchGG(`${GG_API_BASE}/me`)
      const businessId = meData?.id || meData?.businessId || meData?.business?.id
      if (!businessId) throw new Error('Could not determine businessId')

      const pageSize = params?.pageSize || 100
      const status = params?.status || ''
      let url = `${GG_API_BASE}/get-clients/business/${businessId}/payments/paginated?pageSize=${pageSize}`
      if (status) url += `&status=${status}`

      const data = await fetchGG(url)
      return new Response(JSON.stringify(data), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    return new Response(JSON.stringify({ error: 'Unknown action' }), { status: 400, headers: corsHeaders })

  } catch (error) {
    console.error('ggcheckout-api error:', error)
    const msg = error instanceof Error ? error.message : 'Unknown error'
    const isBlocked = msg.includes('API_BLOCKED')
    return new Response(
      JSON.stringify({ error: msg, blocked: isBlocked }),
      { status: isBlocked ? 503 : 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
