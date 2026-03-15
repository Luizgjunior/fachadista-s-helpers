Fachadista - Architectural prompt generator with Lovable Cloud backend

## Design System
- Brand color: Fuchsia (HSL 292 84% 45%) as --primary and --brand
- Custom tokens: brand, brand-light, brand-glow, surface, field-bg, field-border, toggle-on/off
- Font: Inter (imported via Google Fonts)
- Style: Uppercase tracking, rounded cards (up to 45px radius), glass-panel effect

## Architecture
- Types: src/types/fachadista.ts
- Service: src/services/geminiService.ts (uses fetch, not @google/genai SDK)
- Constants: src/constants/defaults.ts
- Components: src/components/fachadista/ (AppHeader, ControlPanel, ComparatorView, ImageUploadZone, PromptResult, SelectField, SliderField, ToggleSwitch)
- Requires VITE_GEMINI_API_KEY env var for Gemini API

## Backend (Lovable Cloud)
- Tables: plans, profiles, prompts, credit_transactions
- Views: admin_metrics (security_invoker)
- Functions: is_admin (security definer), handle_new_user (trigger), consume_credit (RPC)
- RLS: uses is_admin() security definer function to avoid recursion on profiles
- Hooks: useAuth, useCredits, useAdmin
- Routes: /login (public), / (protected), /admin (admin only)
- Auth guard: src/components/ProtectedRoute.tsx

## Removed
- src/repo-source/ (raw downloaded files, replaced by adapted versions)
