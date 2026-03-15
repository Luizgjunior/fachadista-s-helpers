import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-cakto-secret',
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // Validar secret do webhook
    const webhookSecret = req.headers.get('x-cakto-secret')
    const expectedSecret = Deno.env.get('CAKTO_WEBHOOK_SECRET')

    if (!expectedSecret || webhookSecret !== expectedSecret) {
      console.error('Webhook secret inválido')
      return new Response('Unauthorized', { status: 401 })
    }

    const payload = await req.json()
    console.log('Cakto webhook payload:', JSON.stringify(payload))

    // Só processar compras aprovadas
    const status = payload?.order?.status || payload?.status
    if (status !== 'approved' && status !== 'APPROVED') {
      return new Response(JSON.stringify({ message: 'Status ignorado: ' + status }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Extrair dados do payload
    const orderId = String(payload?.order?.id || payload?.id)
    const customerEmail = payload?.customer?.email || payload?.buyer?.email
    const amountPaid = parseFloat(payload?.order?.amount || payload?.amount || '0')

    if (!orderId || !customerEmail) {
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
      .eq('id', orderId)
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
        id: orderId,
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

    const creditsToAdd = creditPackage?.credits ?? 50

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
      description: `Compra via Cakto - ${creditPackage?.name ?? 'Pacote'} - Pedido ${orderId}`
    })

    // Registrar pedido Cakto
    await supabase.from('cakto_orders').insert({
      id: orderId,
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
