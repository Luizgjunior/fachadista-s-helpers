

## Plano: Migrar para fal.ai

### Contexto

A fal.ai é uma plataforma focada em **geração de mídia** (imagens, vídeo, áudio). Ela **não oferece modelos de visão/LLM** para análise de imagens e geração de texto estruturado. Isso significa:

- **Geração de imagens (generate-render)**: Pode ser migrada para fal.ai (ex: Flux 2 Flash, Flux Pro, etc.)
- **Geração de prompts (generate-prompt)**: **Não pode** usar fal.ai, pois precisa de um LLM com visão que analise fotos arquitetônicas e gere JSON estruturado. Para isso, usaremos o **Lovable AI Gateway** (Gemini via gateway, sem necessidade de chave externa)

### Arquitetura proposta

```text
┌─────────────────┐     ┌──────────────────────────┐
│  generate-prompt │────▶│ Lovable AI Gateway       │
│  (edge function) │     │ google/gemini-2.5-flash   │
│                  │     │ (visão + texto, grátis)   │
└─────────────────┘     └──────────────────────────┘

┌─────────────────┐     ┌──────────────────────────┐
│  generate-render │────▶│ fal.ai REST API          │
│  (edge function) │     │ fal-ai/flux/schnell ou   │
│                  │     │ fal-ai/flux-pro/v1.1-ultra│
└─────────────────┘     └──────────────────────────┘
```

### Mudanças

#### 1. Adicionar secret `FAL_KEY`
Solicitar a chave da fal.ai via ferramenta `add_secret`.

#### 2. Reescrever `generate-prompt/index.ts`
- Trocar chamada direta ao Google Gemini por chamada ao **Lovable AI Gateway** (`https://ai.gateway.lovable.dev/v1/chat/completions`)
- Usar `LOVABLE_API_KEY` (já disponível como secret)
- Modelo: `google/gemini-2.5-flash` (suporta visão/imagens + texto)
- Enviar imagens como base64 no formato multimodal do OpenAI-compatible API
- System prompt ARCHVIZ existente mantido
- Retorno JSON com `english`, `portuguese`, `tags`

#### 3. Reescrever `generate-render/index.ts`
- Trocar Gemini Image Generation por **fal.ai REST API**
- Endpoint: `https://fal.run/fal-ai/flux/schnell` (rápido e barato) ou modelo a escolher
- Auth: `Authorization: Key ${FAL_KEY}`
- Body: `{ prompt, image_size }` com mapeamento de aspect ratio para presets fal.ai:
  - `9:16` → `portrait_16_9`
  - `3:4` → `portrait_4_3`
  - `1:1` → `square_hd`
  - `16:9` → `landscape_16_9`
  - `4:3` → `landscape_4_3`
- Resposta retorna `{ images: [{ url, width, height }] }` — retornar a URL diretamente (não mais base64)
- Retry com backoff em 429

#### 4. Atualizar `geminiService.ts`
- `generateSamplePreview`: adaptar para receber URL da imagem ao invés de data URI base64
- Sem mudanças na `generateArchitecturalPrompt` (interface permanece igual)

#### 5. Atualizar `.lovable/memory/index.md`
- Documentar nova arquitetura: Lovable AI Gateway para prompts, fal.ai para renders

### Vantagens
- Sem dependência de chave Google AI Studio (quota/rate limits)
- Prompts gerados via Lovable AI Gateway (sem custo extra de chave)
- Imagens geradas via fal.ai com modelos Flux de alta qualidade
- fal.ai tem rate limits generosos e preço competitivo ($0.005/megapixel no Flash)

