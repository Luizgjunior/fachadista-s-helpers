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
      console.error('Webhook secret inválido. Received length:', webhookSecret?.length, 'Expected length:', expectedSecret?.length)
      return new Response('Unauthorized', { status: 401 })
    }

    const payload = await req.json()
    console.log('ggCheckout webhook payload:', JSON.stringify(payload))

    // Extrair status
    const status = payload?.status || payload?.order?.status || payload?.payment?.status
    const normalizedStatus = String(status).toLowerCase()

    // Só processar compras/renovações aprovadas
    if (!['approved', 'paid', 'completed', 'pago', 'aprovado', 'active', 'renewed'].includes(normalizedStatus)) {
      return new Response(JSON.stringify({ message: 'Status ignorado: ' + status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Detectar tipo de evento (compra única, nova assinatura, renovação)
    const eventType = (
      payload?.event || payload?.type || payload?.event_type || ''
    ).toLowerCase()
    const isRenewal = eventType.includes('renew') || eventType.includes('recur') || eventType.includes('subscription_payment')
    const isSubscription = isRenewal || eventType.includes('subscription') || payload?.subscription_id

    // Extrair dados do payload
    const orderId = String(
      payload?.order?.id || payload?.id || payload?.transaction_id || payload?.payment?.id || ''
    )
    const subscriptionId = String(
      payload?.subscription_id || payload?.subscription?.id || payload?.order?.subscription_id || ''
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

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )

    // Verificar se pedido já foi processado
    const orderKey = `gg_${orderId}`
    const { data: existingOrder } = await supabase
      .from('cakto_orders')
      .select('id')
      .eq('id', orderKey)
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
      .select('id, email, credits, plan_id, subscription_status')
      .eq('email', customerEmail)
      .single()

    if (!profile) {
      console.error('Usuário não encontrado:', customerEmail)
      await supabase.from('cakto_orders').insert({
        id: orderKey,
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

    // Identificar pacote pelo valor pago + tipo (assinatura vs avulso)
    const packageType = isSubscription ? 'subscription' : 'one_time'
    const { data: creditPackage } = await supabase
      .from('credit_packages')
      .select('*')
      .eq('price_brl', amountPaid)
      .eq('type', packageType)
      .eq('is_active', true)
      .maybeSingle()

    // Fallback: tentar qualquer tipo se não encontrou pelo tipo específico
    let finalPackage = creditPackage
    if (!finalPackage) {
      const { data: fallbackPackage } = await supabase
        .from('credit_packages')
        .select('*')
        .eq('price_brl', amountPaid)
        .eq('is_active', true)
        .limit(1)
        .maybeSingle()
      finalPackage = fallbackPackage
    }

    const creditsToAdd = finalPackage?.credits ?? Math.max(Math.floor(amountPaid * 2.5), 10)
    const finalPackageType = finalPackage?.type || packageType

    // Atualizar perfil do usuário
    const profileUpdate: Record<string, unknown> = {
      credits: profile.credits + creditsToAdd,
      updated_at: new Date().toISOString()
    }

    // Se for assinatura, atualizar status e subscription_id
    if (isSubscription || finalPackageType === 'subscription') {
      profileUpdate.subscription_status = 'active'
      profileUpdate.plan_id = finalPackage?.id ?? profile.plan_id
      if (subscriptionId) {
        profileUpdate.subscription_id = subscriptionId
      }
    }

    await supabase
      .from('profiles')
      .update(profileUpdate)
      .eq('id', profile.id)

    // Descrição da transação
    const txDescription = isRenewal
      ? `Renovação mensal via ggCheckout - ${finalPackage?.name ?? 'Plano'} - Pedido ${orderId}`
      : `Compra via ggCheckout - ${finalPackage?.name ?? 'Pacote'} - Pedido ${orderId}`

    // Registrar transação
    await supabase.from('credit_transactions').insert({
      user_id: profile.id,
      amount: creditsToAdd,
      type: isRenewal ? 'recharge' : 'purchase',
      description: txDescription
    })

    // Registrar pedido
    await supabase.from('cakto_orders').insert({
      id: orderKey,
      user_id: profile.id,
      package_id: finalPackage?.id ?? null,
      credits_added: creditsToAdd,
      amount_paid: amountPaid,
      customer_email: customerEmail,
      status: isRenewal ? 'renewed' : 'approved'
    })

    console.log(`Créditos adicionados: ${creditsToAdd} para ${customerEmail} (${isRenewal ? 'renovação' : 'compra'})`)

    return new Response(
      JSON.stringify({
        success: true,
        credits_added: creditsToAdd,
        user: customerEmail,
        type: isRenewal ? 'renewal' : 'purchase'
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
