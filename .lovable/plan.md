

## Análise: Qualidade de Renderização e Geração de Vídeos

### Bug Crítico Encontrado

Há um **bug de compilação** no `generate-render/index.ts`: a variável `projectSpecific` é declarada **duas vezes** (linhas 134 e 147), o que causa erro no Deno. Isso significa que os project-specific prompts (Interiores, Planta) provavelmente **não estão funcionando**.

### Melhorias de Qualidade de Imagem

| Melhoria | O que faz |
|---|---|
| **Corrigir bug do `projectSpecific` duplicado** | Remove a primeira declaração vazia e mantém a lógica correta |
| **Técnica de multi-pass (2 gerações)** | Gera uma imagem inicial, depois usa `edit-image` para refinar detalhes — resultado mais nítido |
| **Upscale prompt** | Adicionar instruções de resolução "8K ultra-high resolution, extreme detail at pixel level" no system prompt |
| **Negative prompt expandido** | Adicionar proibições contra: moiré patterns, banding em céu, aliasing em bordas, bloom excessivo |
| **Material-specific micro-details** | Expandir os STYLE_MAP com sub-instruções de textura por material (vidro, concreto, metal, madeira) |
| **Seed consistency** | Não disponível via Lovable AI Gateway — não é possível fixar seed |

### Geração de Vídeos

**Situação atual**: O Lovable AI Gateway **não suporta geração de vídeo** diretamente. Os modelos disponíveis geram apenas imagens estáticas e texto.

**Alternativas viáveis**:

1. **Vídeo "Ken Burns" a partir do render** — Usar CSS/canvas para criar um efeito de câmera lenta (pan + zoom suave) sobre a imagem renderizada. Resultado: um vídeo de 5-10s com movimento cinematográfico. Pode ser feito 100% no frontend com canvas + MediaRecorder API, sem custo adicional de API.

2. **Slideshow animado** — Gerar múltiplos renders (ângulos diferentes, dia/noite) e criar um vídeo com transições suaves entre eles usando Remotion no sandbox.

3. **API externa (Runway, Kling, etc.)** — Integraria um serviço de vídeo generativo externo. Requer chave API adicional e tem custo significativo por geração (~$0.50-2.00/vídeo).

### Plano Proposto

**Fase 1 — Correções e qualidade (imediato)**:
1. Corrigir bug do `projectSpecific` duplicado no `generate-render`
2. Expandir negative prompts com mais proibições técnicas
3. Adicionar instruções de micro-textura por tipo de material

**Fase 2 — Vídeo Ken Burns (sem custo extra)**:
4. Criar botão "Gerar Vídeo" que aparece após o render
5. Aplicar efeito Ken Burns (pan + zoom lento) sobre o render usando canvas
6. Exportar como MP4/WebM de 5-8 segundos via MediaRecorder API
7. Botão de download do vídeo

### Detalhes Técnicos

- **Bug fix**: Remover linha 134 (`let projectSpecific = '';`) que sobrescreve a declaração da linha 147
- **Ken Burns**: Usa `<canvas>` com `requestAnimationFrame` para animar crop/zoom sobre a imagem, e `canvas.captureStream()` + `MediaRecorder` para gravar como vídeo
- **Formato de saída**: WebM (suportado nativamente) com fallback para download de GIF animado em Safari
- Nenhuma API externa necessária para o vídeo Ken Burns

