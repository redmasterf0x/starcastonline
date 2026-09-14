---
name: starcast-brand-design
description: >-
  StarCast Media official 2026 dark cosmic broadcast design kit and styling system.
  Use when designing, styling, or updating any public or internal page, dashboard,
  portal, or card on StarCast Online to ensure visual brand consistency.
---

# StarCast Media: 2026 Dark Cosmic Design System

This skill provides the visual identity, tokens, and component styling patterns for **StarCast Online** (StarCast Media). All UI built for this project should feel like a premium, modern broadcasting and streaming network.

---

## 1. Brand Palette & Color Tokens

Always use the project's established hex and OKLCH color palette. Avoid default Tailwind grays or generic colors.

| Role | Hex | Tailwind Utility Pattern | Purpose |
| :--- | :--- | :--- | :--- |
| **Deep Space** | `#05051f` | `bg-[#05051f]` | Deepest page canvas background |
| **Base Navy** | `#05052d` | `bg-[#05052d]` | Main container & card backing |
| **Lifted Panel** | `#0c0c3f` | `bg-[#0c0c3f]/60` or `/80` | Modals, elevated cards, sidebar panels |
| **Subtle Border** | `#20205a` | `border-[#20205a]/50` or `/80` | Dividers, card borders, outline rings |
| **Sunset Orange** | `#ea6f2a` | `text-[#ea6f2a]`, `bg-[#ea6f2a]` | Primary brand accent, primary CTA buttons |
| **Rust Hover** | `#bc3f00` | `hover:bg-[#bc3f00]` | Hover state for primary buttons |
| **Electric Cyan** | `#20efe0` | `text-[#20efe0]`, `border-[#20efe0]/30` | Live indicators, DJ/music accents, badges |
| **Emerald Green** | `#22b573` | `text-[#22b573]`, `bg-[#22b573]/20` | Confirmed bookings, approved timesheets |
| **High-Contrast Text** | `#f5f7ff` | `text-[#f5f7ff]` | Main titles, headings, and high-visibility text |
| **Muted Text** | `#9a9fc4` | `text-[#9a9fc4]` | Subtitles, labels, timestamps, metadata |

---

## 2. Public Shell Layout System

Public pages (`/`, `/watch`, `/shows`, `/community`, `/bands/*`, `/sponsors`) use the visual shell defined in `app/globals.css`:

```tsx
export default function PublicPage() {
  return (
    <div className="public-shell min-h-screen text-[#f5f7ff]">
      {/* Navigation */}
      <ResponsiveHeader />

      <main className="public-container public-section">
        {/* Eyebrow Label */}
        <p className="public-eyebrow mb-2">Network Spotlight</p>

        {/* Section Heading */}
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-[#f5f7ff] mb-6">
          Featured Broadcasts
        </h1>

        {/* Glassmorphic Panel Card */}
        <div className="public-panel rounded-2xl p-6 sm:p-8">
          {/* Content */}
        </div>
      </main>

      <Footer />
    </div>
  )
}
```

### Pre-defined CSS Classes (from `globals.css`):
- `.public-shell`: Sets up the ambient radial glows (`#ea6f2a` and `#20efe0`) and the subtle fixed starfield grid.
- `.public-container`: Responsive centered container with `width: min(100% - 2rem, 72rem)`.
- `.public-section`: Responsive vertical padding (`clamp(3rem, 7vw, 6rem)`).
- `.public-eyebrow`: Uppercase, bold, 0.2em letter-spacing orange header tag (`#f08a4a`).
- `.public-panel`: High-end glassmorphic panel with `backdrop-filter: blur(16px)` and gradient fill.

---

## 3. Component Styling Patterns

### Standard Cards & Containers
```tsx
<div className="rounded-xl border border-[#20205a]/50 bg-[#0c0c3f]/60 p-5 transition-all duration-200 hover:border-[#ea6f2a]/40 hover:bg-[#0c0c3f]/80">
  {/* Card body */}
</div>
```

### Primary Buttons
```tsx
<Button className="bg-[#ea6f2a] hover:bg-[#bc3f00] text-white font-semibold shadow-lg shadow-[#ea6f2a]/20 transition-all active:scale-[0.98]">
  <Play className="w-4 h-4 mr-2" /> Watch Episode
</Button>
```

### Secondary / Outline Buttons
```tsx
<Button variant="outline" className="border-[#20205a] bg-[#05052d]/60 text-[#f5f7ff] hover:bg-[#20205a] hover:text-white">
  View Profile
</Button>
```

### Status Badges
```tsx
// Confirmed / Active
<Badge className="bg-[#22b573]/20 text-[#22b573] border border-[#22b573]/40">Active</Badge>

// Pending / Review
<Badge className="bg-amber-500/20 text-amber-400 border border-amber-500/40">Pending</Badge>

// Creator / Music Tier
<Badge className="bg-[#20efe0]/15 text-[#20efe0] border border-[#20efe0]/30">Artist Pass</Badge>
```

---

## 4. Typography Rules
- **Headings & Body Font**: Montserrat (`var(--font-montserrat)`). Clean, geometric, legible at all sizes.
- **Monospace & Timestamps**: Geist Mono (`var(--font-geist-mono)`).
- Maintain strong visual hierarchy:
  - Hero: `text-4xl sm:text-5xl md:text-6xl font-extrabold tracking-tight`
  - Section Title: `text-2xl sm:text-3xl font-bold`
  - Subsection / Card Title: `text-lg font-semibold`
  - Body: `text-sm sm:text-base text-[#9a9fc4]`
