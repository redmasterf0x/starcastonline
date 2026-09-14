# StarCast Online Styling & UI Rules

All UI development in this repository must adhere to the following rules:

1. **Tailwind CSS v4 Standard**:
   - Do NOT create or edit a `tailwind.config.js` or `tailwind.config.ts`.
   - Theme variables and extensions live in `app/globals.css` inside `@theme inline { ... }`.
   - Use OKLCH color variables and CSS utilities.

2. **StarCast Brand Theme**:
   - Strictly adhere to the dark cosmic broadcast aesthetic.
   - Canvas background: `#05051f` / `#05052d`.
   - Cards and elevated surfaces: `bg-[#0c0c3f]/60` with `border-[#20205a]/50`.
   - Primary action buttons: Sunset orange `bg-[#ea6f2a]` with hover `bg-[#bc3f00]`.
   - Live / Media accent: Electric cyan `text-[#20efe0]`.
   - Success / Confirmation: Emerald green `text-[#22b573]`.
   - Text colors: High-contrast `#f5f7ff` for headings and `#9a9fc4` for muted/secondary text.
   - Public pages should opt into `.public-shell`, `.public-container`, and `.public-panel`.

3. **Shadcn UI & Icons**:
   - Reuse components from `@/components/ui/*`.
   - Always merge conditional class names with `cn(...)` from `@/lib/utils`.
   - Use `lucide-react` icons with `shrink-0` and standardized sizing (`w-4 h-4` for buttons, `w-5 h-5` for cards/navigation).
