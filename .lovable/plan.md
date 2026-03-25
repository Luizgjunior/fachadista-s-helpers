

## Modelo Híbrido: Assinatura Mensal + Créditos Avulsos

### Como funciona

Sim, é possível combinar os dois modelos. O cliente assina um plano mensal (recebe créditos todo mês) e, se acabar antes do próximo ciclo, compra créditos avulsos.

```text
┌─────────────────────────────────┐
│  ASSINATURA MENSAL (recorrente) │
│  Ex: Pro R$49,90/mês → 200 cr  │
│  Créditos recarregam todo mês   │
└────────────┬────────────────────┘
             │
             │  Acabou os créditos?
             ▼
┌─────────────────────────────────┐
│  CRÉDITOS AVULSOS (pagto único) │
│  Ex: +50 cr por R$19,90        │
│  Compra quantas vezes quiser    │
└─────────────────────────────────┘
```

### O que precisa no ggCheckout

1. **Produtos recorrentes** — criar 2-3 planos de assinatura mensal no ggCheckout (Starter, Pro, Studio) com cobrança recorrente
2. **Produtos avulsos** — criar pacotes de créditos extras como pagamento único (já temos isso hoje)
3. **Webhooks** — o ggCheckout precisa enviar webhook tanto para pagamento único quanto para renovação mensal

### Implementação no sistema

**1. Separar a página de planos em 2 seções**
- **Assinaturas** (tabs ou seção superior): planos mensais com recarga automática
- **Créditos avulsos** (seção inferior): pacotes de compra única para quem quer recarregar

**2. Adicionar campos na tabela `credit_packages`**
- `type`: `'subscription'` ou `'one_time'` para diferenciar
- `billing_interval`: `'monthly'` para assinaturas

**3. Atualizar webhook para tratar renovações**
- Quando o ggCheckout enviar webhook de renovação mensal, o sistema identifica que é renovação (não compra nova) e adiciona os créditos do ciclo
- Usar o campo `order_id` para diferenciar primeira compra de renovação

**4. Gestão de assinatura no perfil do usuário**
- Salvar `plan_id` e `subscription_status` no perfil
- Mostrar status da assinatura no app (ativo, cancelado, etc.)

### Pré-requisito importante

Antes de implementar, preciso saber:

- **O ggCheckout suporta cobranças recorrentes (assinatura)?** Nem todos os gateways de pagamento suportam. Se não suportar, podemos usar outro gateway para assinaturas (como Stripe) ou manter apenas créditos avulsos
- **Quantos planos de assinatura quer oferecer?** (ex: Básico R$29,90/mês com 100cr, Pro R$49,90/mês com 200cr, etc.)

### Alternativa simples (sem assinatura)

Se o ggCheckout não suportar recorrência, podemos manter apenas **pacotes avulsos** mas com uma abordagem de "planos sugeridos":
- Mostrar os pacotes como se fossem planos (Starter, Pro, Studio)
- O cliente compra manualmente todo mês quando quiser
- Sem cobrança automática, sem cancelamento — mais simples

