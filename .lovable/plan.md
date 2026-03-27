

## Plano: Funcionalidade "Montagem de Fachada" (Facade Placement)

### Resumo
Nova aba no sistema chamada **"Montagem"** onde o usuário:
1. Envia a foto do local (terreno/prédio existente)
2. Envia a foto da fachada (projeto/render)
3. Desenha na foto do local a área onde a fachada deve ser posicionada (ferramenta lápis/marcação)
4. Clica em "Gerar Montagem" → a IA faz a composição realista das duas imagens
5. Custo: **10 créditos**

### Arquitetura

```text
┌─────────────────────────────────────────────┐
│  AppHeader: novo modo "montagem" adicionado │
│  AppMode: 'generator' | 'comparator' | 'montagem' │
└─────────────────────────────────────────────┘
                    │
    ┌───────────────┴───────────────┐
    │  MontageView (novo componente)│
    │                               │
    │  Estado 1: Upload local photo │
    │  Estado 2: Upload facade photo│
    │  Estado 3: Canvas de marcação │
    │    - Imagem do local como fundo│
    │    - Ferramenta lápis (draw)  │
    │    - Botões: Limpar / Desfazer│
    │  Estado 4: Botão "Gerar" →    │
    │    chama edge function        │
    │  Estado 5: Resultado final    │
    └───────────────────────────────┘
                    │
    ┌───────────────┴───────────────┐
    │  Edge Function:               │
    │  generate-montage             │
    │  - Recebe: foto local,        │
    │    foto fachada, máscara      │
    │  - Usa google/gemini-3-pro-   │
    │    image-preview              │
    │  - Prompt: "insert this facade│
    │    into the marked area"      │
    │  - Retorna imagem composta    │
    └───────────────────────────────┘
```

### Alterações por arquivo

**1. `src/types/fachadista.ts`**
- Adicionar `'montagem'` ao tipo `AppMode`

**2. `src/components/fachadista/MontageView.tsx`** (NOVO)
- Componente principal com 3 etapas:
  - **Etapa 1-2**: Dois zonas de upload lado a lado (foto do local + foto da fachada)
  - **Etapa 3**: Canvas HTML5 sobreposto à foto do local onde o usuário desenha com o mouse/toque a área de posicionamento (linha vermelha semi-transparente). Ferramentas: Lápis, Borracha, Limpar, Desfazer
  - **Etapa 4**: Botão "Gerar Montagem (10 créditos)" que envia tudo para a edge function
  - **Etapa 5**: Exibe resultado com opção de download
- Canvas usa `<canvas>` nativo com eventos `onPointerDown/Move/Up` para desenho livre
- A máscara é exportada como imagem (canvas.toDataURL) para enviar ao backend

**3. `src/components/fachadista/AppHeader.tsx`**
- Adicionar botão/tab "Montagem" ao lado de "Gerador" e "Comparador"

**4. `src/pages/Index.tsx`**
- Adicionar estado e renderização do modo `'montagem'`
- Lógica de consumo de 10 créditos via `consumeCredits(10, "Montagem de fachada")`

**5. `src/hooks/useCredits.ts`**
- Adicionar `MONTAGE: 10` ao `CREDIT_COSTS`
- Adicionar `hasCreditsForMontage` e `consumeMontageCredits`

**6. `supabase/functions/generate-montage/index.ts`** (NOVO)
- Edge function que recebe: `locationImage` (base64), `facadeImage` (base64), `maskImage` (base64 da marcação)
- Usa modelo `google/gemini-3-pro-image-preview` (melhor qualidade de imagem)
- System prompt instruindo a IA a inserir a fachada na área marcada da foto, mantendo perspectiva, iluminação e proporções realistas
- Envia as 3 imagens + prompt descritivo ao modelo
- Retorna a imagem composta

### Detalhes técnicos do Canvas de marcação
- O usuário desenha com traço vermelho semi-transparente (`rgba(255, 0, 0, 0.4)`) sobre a foto do local
- Largura do traço ajustável (slider 5-50px)
- Suporte a touch para mobile
- Botão "Desfazer" guarda histórico de strokes
- A máscara exportada mostra apenas a área desenhada (vermelho sobre fundo transparente)

### Modelo de IA
- `google/gemini-3-pro-image-preview` — melhor modelo disponível para geração de imagem, ideal para composição fotorealista

### Custo: 10 créditos por geração

