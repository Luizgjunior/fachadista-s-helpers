NewRender - Architectural prompt generator

## Design System
- Brand color: Fuchsia (HSL 292 84% 45%) as --primary and --brand
- Custom tokens: brand, brand-light, brand-glow, surface, field-bg, field-border, toggle-on/off
- Font: Inter (imported via Google Fonts)
- Style: Uppercase tracking, rounded cards (up to 45px radius), glass-panel effect
- Logo format: NEW<span className="text-primary">RENDER</span> (RENDER in fuchsia)

## Architecture
- Types: src/types/fachadista.ts
- Service: src/services/geminiService.ts (thin client, sends params to edge functions)
- Constants: src/constants/defaults.ts
- Components: src/components/fachadista/

## AI Integration
- Edge function: generate-prompt → Lovable AI Gateway (google/gemini-2.5-pro, tool calling for structured JSON)
  - Prompt construction happens server-side (buildPromptText moved from client)
  - Receives { images, params } — no more client-side promptText
- Edge function: generate-render → Lovable AI Gateway (google/gemini-3-pro-image-preview)
  - CRITICAL: must use `modalities: ["image", "text"]` in request body
  - Prompt enrichment (buildImagePrompt) happens server-side
  - Receives { prompt, params, referenceImage } — aspect ratio derived from params.socialFormat
  - Dynamic system prompt with aspect ratio, project-type-specific instructions, expanded negative prompts
  - Image returned in `message.images[0].image_url.url` (base64 data URI)
- API Key: LOVABLE_API_KEY (auto-provisioned) for both prompt and render

## Removed
- src/repo-source/ (raw downloaded files, replaced by adapted versions)
- Direct Google Gemini API calls (migrated to Lovable AI Gateway)
- fal.ai integration (replaced by Gemini Image)
- Old brand name "FCD ViewPrompt" / "ARCHVIZ INTELLIGENCE LAB" (renamed to NewRender)
- Client-side buildPromptText and buildImagePrompt (moved to edge functions)
