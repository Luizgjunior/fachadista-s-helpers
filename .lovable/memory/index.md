# FCD ViewPrompt — Architectural Prompt Generator

## Stack
- React + TypeScript + Vite + Tailwind CSS
- Supabase (Auth + DB + Edge Functions)
- Lovable Cloud (deploy)
- Gemini API (prompt generation via fetch)

## Design System
- Brand color: Fuchsia (HSL 292 84% 45%) → --primary / --brand
- Tokens: brand, brand-light, brand-glow, surface, surface-muted, field-bg, field-border, field-focus, toggle-on/off
- Font: Inter (Google Fonts)
- Style: uppercase font-black tracking-tight, rounded cards (rounded-[40px] / rounded-[45px]), glass-panel (bg-white/80 backdrop-blur border border-border)

## File Structure
- src/types/fachadista.ts — PromptParameters, GeneratedPrompt, AppMode
- src/constants/defaults.ts — DEFAULT_PARAMS
- src/services/geminiService.ts — generateArchitecturalPrompt (fetch REST)
- src/hooks/useAuth.ts — user, profile, signIn, signUp, signOut, refreshProfile
- src/hooks/useCredits.ts — credits, hasCredits, consumeCredit
- src/hooks/useAdmin.ts — getMetrics, getUsers, updateUserCredits, getCaktoOrders, etc.

## Components
- src/components/fachadista/AppHeader.tsx
- src/components/fachadista/ControlPanel.tsx
- src/components/fachadista/ImageUploadZone.tsx
- src/components/fachadista/PromptResult.tsx
- src/components/fachadista/ComparatorView.tsx
- src/components/fachadista/SelectField.tsx, SliderField.tsx, ToggleSwitch.tsx
- src/components/fachadista/UpgradeModal.tsx
- src/components/shared/LegalFooter.tsx
- src/components/ProtectedRoute.tsx (ProtectedRoute + AdminRoute)
- src/components/admin/AdminDashboard.tsx, AdminUsers.tsx, AdminCredits.tsx

## Routes
- /login, /terms, /privacy → public
- /, /plans → protected
- /admin → admin only

## Supabase Schema
- plans, profiles, prompts, credit_transactions, credit_packages, cakto_orders
- View: admin_metrics (excludes admins)
- RPCs: consume_credit, recharge_pro_users, toggle_admin, is_admin
- Trigger: on_auth_user_created → handle_new_user()
- Edge Function: webhook-cakto (needs CAKTO_WEBHOOK_SECRET)

## Business Rules
- Admin Global (is_admin=true): unlimited credits, excluded from metrics
- Free: 10 initial credits, no auto-renewal
- Purchased credits don't expire, accumulate
- 1 credit = 1 prompt generation

## Pending
- Cakto payment integration (webhook ready, needs CAKTO_WEBHOOK_SECRET)
- Custom domain configuration
