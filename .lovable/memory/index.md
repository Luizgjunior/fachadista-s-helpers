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
- Edge function: generate-prompt (Google Gemini API direct, model: gemini-2.0-flash)
- Edge function: generate-render (Google Gemini API direct, model: gemini-2.0-flash-preview-image-generation)
- API Key: VITE_GEMINI_API_KEY (configured as Supabase Secret)
- No Lovable AI Gateway — direct Google API calls
- 500 images/day free on Google AI Studio free tier

## Removed
- src/repo-source/ (raw downloaded files, replaced by adapted versions)
- Lovable AI Gateway integration (migrated to direct Google API)
