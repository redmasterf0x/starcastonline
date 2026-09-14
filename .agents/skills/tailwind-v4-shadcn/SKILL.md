---
name: tailwind-v4-shadcn
description: >-
  Best practices and styling rules for building UI components in Next.js 16 and React 19
  with Tailwind CSS v4 and Shadcn UI (Radix primitives, Lucide icons, CVA, and clsx/tailwind-merge).
  Use whenever creating or modifying frontend components, pages, forms, modals, or layouts.
---

# Tailwind CSS v4 + Shadcn UI Component Guidelines

This skill defines the technical standards for writing CSS and assembling UI components in StarCast Online, utilizing **Tailwind CSS v4** and **Shadcn UI / Radix Primitives** under **Next.js 16** (React 19).

---

## 1. Tailwind CSS v4 Rules (Crucial Architecture)

In Tailwind CSS v4, traditional configuration habits have changed:
- **NO `tailwind.config.js` or `tailwind.config.ts`**: Do NOT create or edit a JavaScript Tailwind config file. Tailwind v4 is configured directly in CSS.
- **CSS-First Configuration**: Custom tokens, fonts, and theme extensions live directly inside `app/globals.css` using the `@theme inline { ... }` directive.
- **Modern Color Spaces**: The theme uses OKLCH color values for smooth perceptual gradients and rich dark shades:
  - Background: `var(--background)` / `oklch(0.16 0.07 285)`
  - Primary (Brand Orange): `var(--primary)` / `oklch(0.68 0.16 45)`
  - Accent (Cyan): `var(--accent)` / `oklch(0.85 0.14 190)`
  - Muted: `var(--muted)` / `oklch(0.28 0.08 285)`
  - Border: `var(--border)` / `oklch(0.31 0.07 285)`
- **Variant Directives**:
  - Dark mode variant: `@custom-variant dark (&:is(.dark *));`
- **Imports**:
  - `@import "tailwindcss";`
  - `@import "tw-animate-css";`

---

## 2. Shadcn UI & Component Construction

### Utility Merging with `cn()`
Always use the `cn()` helper from `@/lib/utils` when applying conditional classes or allowing class overrides:
```tsx
import { cn } from "@/lib/utils"

export function FeatureCard({ className, active, children }: FeatureCardProps) {
  return (
    <div
      className={cn(
        "rounded-xl border border-[#20205a]/50 bg-[#0c0c3f]/60 p-5 transition-all",
        active && "border-[#ea6f2a] shadow-lg shadow-[#ea6f2a]/10",
        className
      )}
    >
      {children}
    </div>
  )
}
```

### Class Variance Authority (`cva`)
For reusable UI elements with distinct variants (button sizes, badge intents, alert types), use `cva`:
```tsx
import { cva, type VariantProps } from "class-variance-authority"

export const badgeVariants = cva(
  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
  {
    variants: {
      variant: {
        default: "bg-[#ea6f2a] text-white hover:bg-[#bc3f00]",
        secondary: "bg-[#20205a] text-[#9a9fc4] hover:bg-[#2a2a6e]",
        accent: "bg-[#20efe0]/15 text-[#20efe0] border border-[#20efe0]/30",
        destructive: "bg-red-900/30 text-red-400 border border-red-800/40",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)
```

### Radix UI & Accessibility
- Components in `@/components/ui/` wrap accessible Radix primitives (`@radix-ui/react-*`).
- Always preserve `asChild` delegation patterns with `@radix-ui/react-slot`.
- Maintain keyboard focus rings: `focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#ea6f2a]`.

### Lucide React Icons
- Use icons from `lucide-react`.
- Standardize sizes:
  - `w-4 h-4` for button and inline text icons.
  - `w-5 h-5` for menu items and card headers.
  - `w-8 h-8` to `w-12 h-12` for hero badges and empty state illustrations.
- Always include `shrink-0` / `flex-shrink-0` on icons inside flex layouts to avoid squishing.

---

## 3. Responsive & Mobile-First Best Practices
- Design mobile-first using base classes for phone viewport, scaling up with `sm:`, `md:`, `lg:`, `xl:`.
- Use fluid typography and spacing where appropriate via CSS `clamp()` or standard Tailwind scale (`gap-4 md:gap-6 lg:gap-8`).
- Keep buttons minimum `44px` touch target height (`h-11` or `px-4 py-2.5`) for mobile accessibility.
