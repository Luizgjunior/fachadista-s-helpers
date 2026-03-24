

## Análise do Sistema Atual e Plano de Aperfeiçoamento

### Diagnóstico — Problemas Identificados

**1. Prompt duplicado e conflitante**
- O `buildPromptText` (cliente) envia instruções em português misturadas com inglês para o LLM
- O `ARCHVIZ_SYSTEM_PROMPT` (edge function) repete as mesmas regras por cima
- O LLM recebe instruções redundantes e às vezes contraditórias, diluindo a qualidade

**2. Modelo fraco para geração de prompt**
- Usa `gemini-2.5-flash` — modelo rápido/barato, não o melhor para raciocínio complexo com imagens
- Para análise arquitetônica detalhada, `gemini-2.5-pro` ou `gemini-3.1-pro-preview` produziriam prompts significativamente superiores

**3. Prompt de renderização não recebe o aspect ratio**
- O `aspectRatio` é calculado no cliente mas **nunca enviado** à edge function `generate-render`
- A imagem é gerada sem respeitar o formato escolhido (9:16, 16:9, etc.)

**4. Enriquecimento do prompt de imagem acontece no cliente**
- O `buildImagePrompt` roda no frontend — se alguém atualizar a lógica, precisa fazer deploy do app todo
- Deveria rodar na edge function para iteração rápida

**5. System prompt do render é genérico demais**
- Falta instrução sobre aspect ratio, resolução, e estilo específico do tipo de projeto
- Falta negative prompt mais agressivo contra artefatos comuns de IA

**6. Sem pipeline de refinamento**
- O prompt gerado vai direto para o modelo de imagem sem nenhuma etapa de otimização
- Um passo de "prompt polishing" dedicado poderia melhorar drasticamente a qualidade

---

### Plano de Melhorias

#### Mudança 1 — Upgrade do modelo de geração de prompt
- Trocar de `gemini-2.5-flash` para `gemini-2.5-pro` na edge function `generate-prompt`
- Raciocínio mais profundo = análise melhor da imagem de referência = prompt mais preciso

#### Mudança 2 — Eliminar redundância no prompt
- Mover TODA a lógica de construção do prompt para a edge function `generate-prompt`
- O cliente envia apenas os parâmetros estruturados (JSON) + imagens
- A edge function monta o promptText internamente, sem conflito com o system prompt
- Simplificar `geminiService.ts` para enviar só `{ images, params }`

#### Mudança 3 — Passar aspect ratio para o render
- Enviar `aspectRatio` no body da chamada a `generate-render`
- Incluir instrução explícita no prompt: `"Output image MUST be in {aspectRatio} aspect ratio"`

#### Mudança 4 — Mover enriquecimento de prompt para edge function
- Migrar `buildImagePrompt` para dentro de `generate-render`
- A edge function recebe `{ prompt, params, referenceImage }` e enriquece internamente
- Isso permite iterar no prompt de imagem sem deploy do frontend

#### Mudança 5 — System prompt do render mais técnico
- Adicionar instruções de aspect ratio e resolução
- Negative prompts expandidos: "no blurry text on signs", "no distorted hands", "no melted architecture", "no perspective distortion"
- Instruções específicas por tipo de projeto (interiores vs fachada vs planta)

#### Mudança 6 — Etapa de "Prompt Polish" (opcional, segundo passo)
- Criar edge function `polish-prompt` que recebe o prompt bruto do passo 1 e otimiza para geração de imagem
- Usa modelo rápido (`gemini-2.5-flash`) para reformatar o prompt especificamente para o modelo de imagem
- Isso pode ser ativado como toggle no futuro

---

### Arquivos Alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/generate-prompt/index.ts` | Modelo → `gemini-2.5-pro`, incorporar `buildPromptText` internamente, receber `params` em vez de `promptText` |
| `supabase/functions/generate-render/index.ts` | Incorporar `buildImagePrompt` + aspect ratio no prompt, negative prompts expandidos |
| `src/services/geminiService.ts` | Simplificar: enviar `{ images, params }` para prompt; enviar `{ prompt, params, referenceImage }` para render |
| `src/types/fachadista.ts` | Sem mudança |

### Detalhes Técnicos

**generate-prompt** receberá:
```json
{ "images": ["data:image/..."], "params": { "projectType": "...", "lighting": "...", ... } }
```
E construirá o promptText internamente com as mesmas regras do `buildPromptText` atual.

**generate-render** receberá:
```json
{ "prompt": "...", "params": { ... }, "referenceImage": "data:image/..." }
```
E aplicará `buildImagePrompt` + aspect ratio + negative prompts expandidos internamente.

O `geminiService.ts` ficará com ~50 linhas em vez de ~230, apenas fazendo as chamadas e tratando erros.

