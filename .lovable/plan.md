

## Plano: Integrar ggCheckout para Pagamento de Créditos

### Visão Geral

Substituir o webhook Cakto pelo ggCheckout, ativar os botões de compra na página de planos, e receber webhooks de pagamento aprovado para creditar automaticamente os créditos na conta do usuário.

### Fluxo do Checkout

```text
Usuário clica "Comprar"
       │
       ▼
Redireciona para checkout.ggcheckout.com/{slug}
       │
       ▼
Usuário paga (Pix, Cartão, Boleto)
       │
       ▼
ggCheckout envia webhook POST → Edge Function /webhook-ggcheckout
       │
       ▼
Edge Function valida → identifica pacote → adiciona créditos → registra pedido
```

### Etapas de Implementação

**1. Adicionar coluna `gg_checkout_url` na tabela `credit_packages`**
- Migration para adicionar coluna `gg_checkout_url text` (nullable)
- Inserir as URLs dos checkout pages que você já criou no ggCheckout para cada pacote (Starter, Pro, Studio)

**2. Criar Edge Function `webhook-ggcheckout`**
- Baseada na estrutura existente do `webhook-cakto`, adaptada ao payload do ggCheckout
- Validação de segurança via header secreto (ex: `x-gg-secret`)
- Fluxo: validar secret → extrair dados (order ID, email, valor) → verificar duplicata → buscar usuário → identificar pacote → adicionar créditos → registrar transação e pedido
- A URL será: `https://pbxztrijlqurueyfcush.supabase.co/functions/v1/webhook-ggcheckout`

**3. Configurar secret do webhook**
- Adicionar secret `GGCHECKOUT_WEBHOOK_SECRET` via ferramenta de secrets
- Você configurará essa mesma string no painel do ggCheckout como header do webhook

**4. Ativar botões de compra na página `/plans`**
- Trocar botões "Em breve" (disabled) por botões ativos que redirecionam para a `gg_checkout_url` do pacote
- Adicionar `?email={userEmail}` na URL para pré-preencher o email do comprador
- Mesma lógica na landing page

**5. Atualizar textos e FAQ**
- Trocar referências "Cakto" por "ggCheckout" no FAQ da página de planos
- Atualizar texto "Pagamentos chegando em breve" para CTA ativo

### O Que Você Precisará Fazer

1. **No painel ggCheckout**: Configurar webhook customizado apontando para a URL da edge function com o header secreto
2. **Me informar**: As URLs dos 3 checkout pages (Starter, Pro, Studio) para eu inserir no banco
3. **Me informar**: A estrutura exata do payload do webhook (ou eu uso a estrutura padrão documentada do ggCheckout)

### Detalhes Técnicos

- A edge function `webhook-ggcheckout` terá `verify_jwt = false` (webhooks externos não enviam JWT)
- Reutiliza tabelas existentes: `cakto_orders` (renomear para `checkout_orders` ou manter e adicionar coluna `source`), `credit_transactions`, `profiles`
- Fallback: se o pacote não for identificado pelo valor, usa quantidade padrão baseada no preço
- O webhook Cakto existente será mantido como fallback (sem exclusão)

