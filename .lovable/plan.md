

## Plano: Melhorar a qualidade da geração de imagem

### Situação atual
- O render usa o modelo **Nano Banana 2** (`google/gemini-3.1-flash-image-preview`) — rápido, mas não é o de maior qualidade disponível.
- O prompt enviado ao modelo de imagem é bom, mas pode ser mais técnico e direcionado para fotorrealismo arquitetônico.
- O `buildImagePrompt` no `geminiService.ts` já enriquece o prompt com detalhes de iluminação, clima e materiais, mas esse prompt enriquecido poderia ser melhor estruturado para o modelo de imagem.

### Melhorias propostas

**1. Usar o modelo de maior qualidade: `google/gemini-3-pro-image-preview`**
- É o modelo "Nano Banana Pro" — produz resultados significativamente melhores, com mais fidelidade a detalhes arquitetônicos, texturas e iluminação.
- Tradeoff: é mais lento e mais caro. Podemos oferecer como opção ou usar como padrão.

**2. Aprimorar o system prompt de renderização**
- Adicionar instruções mais específicas sobre preservação de geometria, micro-texturas, física de luz e composição fotográfica.
- Incluir referências técnicas de câmera (lente, abertura, ISO) diretamente no prompt de renderização.
- Reforçar negative prompts para evitar artefatos comuns (superfícies plásticas, sombras incorretas, vegetação artificial).

**3. Adicionar um `system` message separado**
- Atualmente tudo vai em uma única mensagem `user`. Separar o papel do modelo em uma mensagem `system` pode melhorar a aderência às instruções.

### Arquivos alterados

| Arquivo | Mudança |
|---|---|
| `supabase/functions/generate-render/index.ts` | Trocar modelo para `gemini-3-pro-image-preview`, adicionar system message, melhorar instruções de renderização |

### Detalhes técnicos

- **Modelo**: `google/gemini-3-pro-image-preview` (maior qualidade)
- **System message**: Persona de fotógrafo arquitetônico profissional com regras técnicas rígidas
- **User message**: Imagem de referência + prompt mestre enriquecido com instruções de fidelidade geométrica, micro-texturas e negative prompts expandidos
- Nenhuma alteração no frontend ou no `geminiService.ts`

