

## Plano: Integrar Fal AI para Vídeo + Precificação com Lucro 5x

### Cálculo de Custos e Precificação

| Recurso | Custo Fal AI (USD) | Custo ~BRL (R$5.50/USD) | Créditos cobrados | Valor do crédito (plano 200cr = R$49,90) | Receita por uso | Margem |
|---|---|---|---|---|---|---|
| **Vídeo 5s (Standard)** | $0.28 | R$1,54 | **10 créditos** | R$2,50 | R$2,50 | **1,6x** |
| **Vídeo 5s (Pro)** | $0.49 | R$2,70 | **10 créditos** | R$2,50 | R$2,50 | ~1x |
| **Vídeo 10s (Standard)** | $0.56 | R$3,08 | **20 créditos** | R$5,00 | R$5,00 | **1,6x** |

Com o plano de 200 créditos a R$49,90, cada crédito vale ~R$0,25.

Para atingir **margem 5x** real:

| Recurso | Custo real BRL | Créditos (lucro 5x) | Receita | Margem |
|---|---|---|---|---|
| **Vídeo 5s (Standard)** | R$1,54 | **30 créditos** (R$7,50) | R$7,50 | **4,9x** ✅ |
| **Vídeo 10s (Standard)** | R$3,08 | **60 créditos** (R$15,00) | R$15,00 | **4,9x** ✅ |
| Prompt (Lovable AI) | ~R$0,05 | 3 créditos (R$0,75) | R$0,75 | **15x** ✅ |
| Render imagem (Lovable AI) | ~R$0,10 | 5 créditos (R$1,25) | R$1,25 | **12x** ✅ |

**Decisão: Usar Kling 2.1 Standard (melhor custo-benefício) e cobrar 30 créditos por vídeo de 5s.**

### Implementação

**1. Remover Ken Burns**
- Deletar `src/components/fachadista/KenBurnsVideo.tsx`
- Remover referência do `PromptResult.tsx`

**2. Nova edge function `supabase/functions/generate-video/index.ts`**
- Endpoint: `fal-ai/kling-video/v2.1/standard/image-to-video`
- Fluxo: submit job → polling status → retorna URL do vídeo MP4
- Usa `FAL_KEY` (já configurada nos secrets)
- Consome 30 créditos via `consume_credits_bulk`
- Timeout máximo: 120s de polling

**3. Atualizar `src/hooks/useCredits.ts`**
- Adicionar `CREDIT_COSTS.VIDEO = 30`
- Adicionar `hasCreditsForVideo` e `consumeVideoCredits`

**4. Criar componente `src/components/fachadista/AIVideoGenerator.tsx`**
- Botão "Gerar Animação IA" com custo exibido (30 créditos)
- Presets de movimento: "Câmera orbital", "Zoom dramático", "Ambiente vivo"
- Loading com mensagens progressivas e polling
- Player de vídeo MP4 com download
- Aparece apenas após render concluído

**5. Atualizar `src/components/fachadista/PromptResult.tsx`**
- Substituir `KenBurnsVideo` por `AIVideoGenerator`
- Passar `userCredits`, `isAdmin`, e `consumeVideoCredits`

**6. Atualizar página de Planos**
- Incluir vídeos no cálculo: "X prompts ou Y renders ou Z vídeos IA"

### Detalhes técnicos

- API Fal AI Queue: `POST https://queue.fal.run/fal-ai/kling-video/v2.1/standard/image-to-video` com `{ image_url, prompt, duration: "5" }`
- Polling: `GET https://queue.fal.run/.../requests/{id}/status` até `COMPLETED`
- Resposta: `{ video: { url: "https://v3.fal.media/..." } }`
- A imagem do render será enviada como base64 data URL ou URL pública
- Prompt de movimento será derivado do prompt arquitetônico + preset de câmera

