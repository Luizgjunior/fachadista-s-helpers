import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-gg-secret',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar secret do webhook
    const webhookSecret = req.headers.get('x-gg-secret')
    const expectedSecret = Deno.env.get('GGCHECKOUT_WEBHOOK_SECRET')

    if (!expectedSecret || webhookSecret !== expectedSecret) {
      console.error('Webhook secret inválido')
      return new Response('Unauthorized', { status: 401 })
    }

    const payload = await req.json()
    console.log('ggCheckout webhook payload:', JSON.stringify(payload))

    // Extrair status - adaptar conforme payload real do ggCheckout
    const status = payload?.status || payload?.order?.status || payload?.payment?.status
    const normalizedStatus = String(status).toLowerCase()

    // Só processar compras aprovadas/pagas
    if (!['approved', 'paid', 'completed', 'pago', 'aprovado'].includes(normalizedStatus)) {
      return new Response(JSON.stringify({ message: 'Status ignorado: ' + status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extrair dados do payload - múltiplos formatos possíveis
    const orderId = String(
      payload?.order?.id || payload?.id || payload?.transaction_id || payload?.payment?.id || ''
    )
    const customerEmail = (
      payload?.customer?.email || payload?.buyer?.email || payload?.email || ''
    ).toLowerCase().trim()
    const amountPaid = parseFloat(
      payload?.order?.amount || payload?.amount || payload?.payment?.amount || payload?.total || '0'
    )

    if (!orderId || !customerEmail) {
      console.error('Dados insuficientes:', { orderId, customerEmail })
      return new Response('Dados insuficientes no payload', {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'text/plain' }
      })
    }

    // Criar cliente Supabase com service role
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar se pedido já foi processado
    const { data: existingOrder } = await supabase
      .from('cakto_orders')
      .select('id')
      .eq('id', `gg_${orderId}`)
      .single()

    if (existingOrder) {
      console.log('Pedido já processado:', orderId)
      return new Response(JSON.stringify({ message: 'Pedido já processado' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Buscar usuário pelo email
    const { data: profile } = await supabase
      .from('profiles')
      .select('id, email, credits')
      .eq('email', customerEmail)
      .single()

    if (!profile) {
      console.error('Usuário não encontrado:', customerEmail)
      await supabase.from('cakto_orders').insert({
        id: `gg_${orderId}`,
        user_id: null,
        package_id: null,
        credits_added: 0,
        amount_paid: amountPaid,
        customer_email: customerEmail,
        status: 'user_not_found'
      })
      return new Response(JSON.stringify({ error: 'Usuário não encontrado' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Identificar pacote pelo valor pago
    const { data: creditPackage } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('price_brl', amountPaid)
      .eq('is_active', true)
      .single()

    const creditsToAdd = creditPackage?.credits ?? Math.max(Math.floor(amountPaid * 2.5), 10)

    // Adicionar créditos ao usuário
    await supabase
      .from('profiles')
      .update({
        credits: profile.credits + creditsToAdd,
        updated_at: new Date().toISOString()
      })
      .eq('id', profile.id)

    // Registrar transação
    await supabase.from('credit_transactions').insert({
      user_id: profile.id,
      amount: creditsToAdd,
      type: 'purchase',
      description: `Compra via ggCheckout - ${creditPackage?.name ?? 'Pacote'} - Pedido ${orderId}`
    })

    // Registrar pedido
    await supabase.from('cakto_orders').insert({
      id: `gg_${orderId}`,
      user_id: profile.id,
      package_id: creditPackage?.id ?? null,
      credits_added: creditsToAdd,
      amount_paid: amountPaid,
      customer_email: customerEmail,
      status: 'approved'
    })

    console.log(`Créditos adicionados: ${creditsToAdd} para ${customerEmail}`)

    return new Response(
      JSON.stringify({
        success: true,
        credits_added: creditsToAdd,
        user: customerEmail
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Erro no webhook:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
