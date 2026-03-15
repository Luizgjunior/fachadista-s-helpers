

# Mobile-First Redesign Plan

## Problems Identified

1. **Header**: Too crowded on mobile — logo, mode switcher, user button, reset button all in one row. Overflows on small screens.
2. **ControlPanel**: Uses `sticky top-10` which doesn't work well on mobile. The panel appears after scrolling past images on mobile, making it hard to access.
3. **Main layout**: `grid-cols-12` desktop-first grid. On mobile, ControlPanel renders below content — user must scroll past image zone to reach controls.
4. **Footer**: Excessive padding (`p-16`) on mobile.
5. **Various components**: Large border-radius (45px), padding, and font sizes not optimized for small screens.

## Plan

### 1. AppHeader — Compact Mobile Header
- **Mobile (default)**: Two rows. Row 1: logo + user avatar/login button. Row 2: mode switcher (full width). Reset button becomes icon-only.
- **Desktop (md+)**: Current single-row layout preserved.
- Reduce padding from `px-6 py-6` to `px-4 py-3` on mobile.

### 2. Index.tsx — Mobile Layout with Bottom Sheet Controls
- On mobile, show a fixed bottom bar with "Configurações" button that opens the ControlPanel in a **Drawer** (bottom sheet using existing `vaul` drawer component).
- Desktop keeps current side panel layout.
- Reduce grid gap and padding on mobile.
- Footer: reduce padding to `p-6` on mobile.

### 3. ControlPanel — Drawer-Compatible
- Extract inner content into a reusable piece.
- On mobile: rendered inside a Drawer from bottom.
- On desktop: keep current sticky sidebar.
- Reduce border-radius from 45px to 24px on mobile.
- Generate button stays visible at bottom of drawer.

### 4. ImageUploadZone — Mobile Optimizations
- Reduce `min-h-[380px]` to `min-h-[280px]` on mobile.
- Smaller icons and text on mobile.
- Border-radius: 24px on mobile, 45px on desktop.

### 5. PromptResult — Mobile Optimizations
- Stack grid to single column (already does this).
- Reduce padding from `p-8`/`p-12` to `p-5` on mobile.
- Smaller border-radius on mobile.

### 6. ComparatorView — Mobile Optimizations
- Reduce card border-radius and padding on mobile.
- Smaller aspect ratio cards.

### Files to Modify
- `src/components/fachadista/AppHeader.tsx` — responsive header
- `src/pages/Index.tsx` — add Drawer for mobile controls, fix layout
- `src/components/fachadista/ControlPanel.tsx` — export inner content, mobile-friendly sizing
- `src/components/fachadista/ImageUploadZone.tsx` — mobile sizing
- `src/components/fachadista/PromptResult.tsx` — mobile sizing
- `src/components/fachadista/ComparatorView.tsx` — mobile sizing

