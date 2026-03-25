# Memory: index.md
Updated: now

Fachadista - Architectural prompt generator adapted from GitHub repo

## Design System
- Brand color: Fuchsia (HSL 292 84% 45%) as --primary and --brand
- Custom tokens: brand, brand-light, brand-glow, surface, field-bg, field-border, toggle-on/off
- Font: Inter (imported via Google Fonts)
- Style: Uppercase tracking, rounded cards (up to 45px radius), glass-panel effect

## Architecture
- Types: src/types/fachadista.ts
- Service: src/services/geminiService.ts (uses fetch, not @google/genai SDK)
- Constants: src/constants/defaults.ts
- Components: src/components/fachadista/ (AppHeader, ControlPanel, ComparatorView, ImageUploadZone, PromptResult, SelectField, SliderField, ToggleSwitch, AIVideoGenerator, UpgradeModal)
- Requires VITE_GEMINI_API_KEY env var for Gemini API

## Credit Costs
- PROMPT: 3 credits
- IMAGE: 5 credits  
- VIDEO: 30 credits (Fal AI Kling 2.1 Standard, ~$0.28/video, margin ~5x)

## Edge Functions
- generate-prompt: Lovable AI prompt generation
- generate-render: Lovable AI image generation
- generate-video: Fal AI Kling 2.1 Standard image-to-video (FAL_KEY secret)
- admin-create-user: Admin user creation
- webhook-cakto: Payment webhook

## Removed
- src/repo-source/ (raw downloaded files, replaced by adapted versions)
- KenBurnsVideo.tsx (replaced by AIVideoGenerator with Fal AI)
