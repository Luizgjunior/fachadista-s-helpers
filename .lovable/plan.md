

## Plano: Integrar API do ggCheckout ao Dashboard Admin

### O que será feito

Criar uma edge function que consulta a API do ggCheckout para buscar pagamentos e dados do negócio em tempo real, e uma nova seção no dashboard admin que exibe esses dados lado a lado com os dados locais.

### Etapas

**1. Salvar a API Key do ggCheckout como secret**
- Adicionar `GGCHECKOUT_API_KEY` com o valor `ggck_live_eefba2cf32e6a3f790dacdc855f02ac631096d8fdb7ca49011c4288c96dd3307`

**2. Criar edge function `ggcheckout-api`**

A função fará proxy das chamadas à API `https://www.ggcheckout.com/` com autenticação Bearer. Endpoints disponíveis:

- `GET /api/me` — obter businessId
- `GET /api/get-clients/business/{businessId}/payments` — listar todos pagamentos
- `GET /api/get-clients/business/{businessId}/payments/paginated?pageSize=50&status=paid` — pagamentos paginados com filtros

A edge function receberá um parâmetro `action` (ex: `list_payments`, `get_business`) e retornará os dados da API do ggCheckout. Apenas admins autenticados poderão chamar.

**3. Criar componente `AdminGGCheckout.tsx`**

Nova aba "ggCheckout" no painel admin com:
- KPIs do ggCheckout: total de pagamentos, valor total, pagamentos pendentes vs pagos
- Lista de pagamentos recentes com status, email, valor, produto e data
- Busca por email
- Botão de reconciliação: comparar pagamentos do ggCheckout com pedidos locais na tabela `cakto_orders` e destacar divergências (pagamentos pagos que não geraram créditos)

**4. Atualizar `Admin.tsx` e `useAdmin.ts`**

- Adicionar nova aba "ggCheckout" na navegação
- Adicionar método `getGGCheckoutPayments()` no hook que invoca a edge function

### Detalhes Técnicos

- API base: `https://www.ggcheckout.com/`
- Auth: `Authorization: Bearer {GGCHECKOUT_API_KEY}`
- Primeiro chama `/api/me` para obter `businessId`, depois usa o `businessId` para listar pagamentos
- Edge function com `verify_jwt = false` (validação JWT em código)
- Reconciliação: cruzar `payment.id` do ggCheckout com `id` na tabela `cakto_orders` (prefixo `gg_`)

