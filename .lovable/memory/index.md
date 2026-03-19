# Memory: index.md
Updated: now

Fachadista - Architectural prompt generator

## Design System
- Brand color: Fuchsia (HSL 292 84% 45%) as --primary and --brand
- Custom tokens: brand, brand-light, brand-glow, surface, field-bg, field-border, toggle-on/off
- Font: Inter (imported via Google Fonts)
- Style: Uppercase tracking, rounded cards (up to 45px radius), glass-panel effect

## Architecture
- Types: src/types/fachadista.ts
- Service: src/services/geminiService.ts
- Constants: src/constants/defaults.ts
- Components: src/components/fachadista/

## AI Integration
- Edge function: generate-prompt → Lovable AI Gateway (google/gemini-2.5-flash, tool calling for structured JSON)
- Edge function: generate-render → Lovable AI Gateway (google/gemini-3-pro-image-preview aka Nano Banana Pro)
  - CRITICAL: must use `modalities: ["image", "text"]` in request body
  - Uses system message with architectural photographer persona
  - Image returned in `message.images[0].image_url.url` (base64 data URI)
  - Supports image-to-image: send reference as image_url in user content
- API Key: LOVABLE_API_KEY (auto-provisioned) for both prompt and render

## Removed
- src/repo-source/ (raw downloaded files, replaced by adapted versions)
- Direct Google Gemini API calls (migrated to Lovable AI Gateway)
- fal.ai integration (replaced by Nano Banana Pro)
