# FCD ViewPrompt — Architectural Prompt Generator

## Stack
- React + TypeScript + Vite + Tailwind CSS
- Supabase (Auth + DB + Edge Functions)
- Lovable Cloud (deploy)
- Lovable AI Gateway (prompt + image generation via edge functions)

## Design System
- Brand color: Fuchsia (HSL 292 84% 45%) → --primary / --brand
- Tokens: brand, brand-light, brand-glow, surface, surface-muted, field-bg, field-border, field-focus, toggle-on/off
- Font: Inter (Google Fonts)
- Style: uppercase font-black tracking-tight, rounded cards (rounded-[40px] / rounded-[45px]), glass-panel (bg-white/80 backdrop-blur border border-border)

## AI Integration
- Edge function: generate-prompt (google/gemini-2.5-flash, multimodal text+images)
- Edge function: generate-render (google/gemini-2.5-flash-image, image generation)
- NO direct Gemini API calls from client — all via Lovable AI Gateway
- NO VITE_GEMINI_API_KEY needed — uses LOVABLE_API_KEY (auto-provisioned)

## File Structure
- src/types/fachadista.ts — PromptParameters, GeneratedPrompt, AppMode
- src/constants/defaults.ts — DEFAULT_PARAMS
- src/services/geminiService.ts — calls edge functions via supabase.functions.invoke
- src/hooks/useAuth.ts — user, profile, signIn, signUp, signOut, refreshProfile
- src/hooks/useCredits.ts — credits, hasCredits, consumePromptCredits, consumeImageCredits
- src/hooks/useAdmin.ts — getMetrics, getUsers, updateUserCredits, getCaktoOrders, etc.

## Credit Costs
- PROMPT: 3 credits
- IMAGE (render): 5 credits
- Admins: unlimited (no consumption)

## Routes
- /login, /terms, /privacy → public
- /, /plans → protected
- /admin → admin only

## Supabase Schema
- plans, profiles, prompts, credit_transactions, credit_packages, cakto_orders
- View: admin_metrics (excludes admins, includes renders)
- RPCs: consume_credit, consume_credits_bulk, recharge_pro_users, toggle_admin, is_admin
- Trigger: on_auth_user_created → handle_new_user()
- Edge Functions: webhook-cakto, generate-prompt, generate-render
