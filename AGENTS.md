# StarCast Online — Project Context for AI Agents

> Auto-loaded by Antigravity for every chat in this repo. Read this first instead of
> re-researching the codebase. **Keep it up to date**: if you add a table, service,
> env var, or change a convention, update the relevant section here in the same change.

## 1. What this is

StarCast Media's site at **https://starcast.online**: a media/broadcast brand (YouTube shows,
articles), a member community (posts, friends, DMs), a recording-studio portal for bands
(bookings, public band pages, music catalog, ticketed events), a staff/production calendar,
sponsorships, and merch.

- The whole app lives in **`starcast-employee-login-2/`** (Next.js). The repo root only holds
  deploy config, a built Android `.aab`, and one-off `patch_*.cjs` scripts (ignore those).
- Originally scaffolded with v0 (Vercel), then migrated off Supabase. Expect leftover
  `[v0]` log prefixes and legacy files.

## 2. Stack

| Layer | Tech |
|---|---|
| Framework | Next.js 16 (App Router), React 19, TypeScript (`ignoreBuildErrors: true` in `next.config.mjs`) |
| UI | Tailwind CSS v4 (no tailwind.config — theme in `app/globals.css`), shadcn/ui (`components/ui`), lucide-react, sonner |
| DB | **Neon Postgres** via `pg` Pool + **Drizzle ORM** (`lib/db`) |
| Auth | **Better Auth** (Google OAuth only + optional phone OTP plugin) |
| Payments | Stripe (Checkout, Connect for bands & staff payouts) |
| Email | Resend (`lib/email.ts`, from `noreply@starcast.online`) |
| SMS | Twilio (`lib/sms.ts`, REST + Verify) |
| Secondary store | Firebase Firestore (project `starcastonline-live`) — **support inbox only** |
| Merch | Printify API (`lib/printify.ts`) |
| Video | YouTube public RSS feeds/scraping (`lib/youtube.ts`, no API key needed) |

Styling rules: see `.agents/rules/styling.md` and the `starcast-brand-design` / `tailwind-v4-shadcn` skills.

## 3. Hosting & deployment

- **Primary: Firebase App Hosting** — backend `starcast-backend`, project `starcastonline-live`,
  config in `starcast-employee-login-2/apphosting.yaml` (env vars + Secret Manager refs).
  Root `firebase.json` points `rootDir` at `starcast-employee-login-2`.
- **Legacy/alt: Netlify** (`netlify.toml`, `@netlify/plugin-nextjs`). Code must still work when
  Netlify-only APIs (e.g. Netlify Blobs) are unavailable — always wrap them in try/catch.
- `.github/workflows/build-android-bundle.yml` builds the Android wrapper app.
- Dev: `cd starcast-employee-login-2 && npm run dev`. Shell is **Windows PowerShell**.

## 4. Directory map (inside `starcast-employee-login-2/`)

```
app/
  actions/        Server actions ("use server") — THE main backend layer. One file per domain.
  api/            Route handlers (webhooks, uploads, cron, OG images, RSS, auth)
  <route>/        Pages. Public: /, /articles, /shows, /watch, /music, /bands/[slug], /merch,
                  /sponsors, /community, /u/[username], /tickets/[token]
                  Authed: /dashboard, /portal (band studio portal), /onboarding, /profile
                  Staff: /staff, /production   Admin: /admin, /admin/support
components/       Feature folders: bands, community, dashboard, music, onboarding, portal,
                  profile, studio, spaceflight; ui/ = shadcn primitives
lib/
  db/schema.ts    Drizzle schema (source of truth for Postgres tables)
  db/index.ts     `db` (drizzle) + `pool` (pg) — resolves DB URL from env
  auth.ts         Better Auth server config;  auth-client.ts = client
  permissions.ts  Role/permission helpers (use these for authz!)
  require-admin-route.ts  Admin guard for API route handlers
  email.ts / sms.ts / stripe.ts / printify.ts / youtube.ts / products.ts (sponsor packages)
  firebase/       admin.ts (Admin SDK init), firestore-service.ts
scripts/          migrate-*.js (current migration style) + old *.sql (LEGACY Supabase, don't use)
netlify/database/migrations/  Drizzle-kit output (only the initial migration)
```

## 5. Auth & identity (important!)

- Better Auth tables: `user`, `session`, `account`, `verification` (camelCase columns, text ids).
- **Email/password is disabled** — Google OAuth is the only sign-in. Phone OTP is optional (for SMS notifications).
- On user creation, a `databaseHooks.user.create.after` hook inserts a **`profiles`** row with an auto-generated unique `username`.
- **Two different ids exist:**
  - `user.id` (text) = Better Auth id. Most app tables store this in `userId` / `user_id` / `owner_user_id` etc.
  - `profiles.id` (uuid). Used by `notifications.recipient_profile_id/actor_profile_id` and `articles.author_id` / `community_posts.author_id`.
- Get the session server-side: `auth.api.getSession({ headers: await headers() })`.
- `middleware.ts` only checks the session cookie for `/dashboard`, `/admin`, `/production`, `/staff`. **Role checks happen in server code**, not middleware.

### Roles & permissions (`lib/permissions.ts`)
- Stored on `profiles`: `role` (`user`|`staff`|`admin`), plus legacy booleans `isAdmin`, `isEmployee`, and granular `canWriteArticles`, `canManageCalendar`.
- `getViewerPermissions()` reconciles them: admin = `isAdmin || role==='admin'`; staff = admin || `isEmployee` || `role==='staff'`. Admin implies all permissions.
- Guards: `requireViewer`, `requireStaff`, `requireAdmin`, `requireArticleWriter`, `requireCalendarManager`, `requireSocialPrivileges` (blocks `socialBanned` users from posting/commenting/liking/DMs/friend requests; admins can't be banned).
- API routes: `requireAdminRoute()` returns `{ok, status}`.

## 6. Database schema (Postgres / Drizzle)

Source of truth: `lib/db/schema.ts`. **Column naming is mixed** — some columns are quoted camelCase
(`"userId"`), most are snake_case. Always check the schema before writing raw SQL.
Status/enum-like fields are plain `text` (values listed in comments). Few real FKs exist.

| Domain | Tables | Notes |
|---|---|---|
| Auth | `user`, `session`, `account`, `verification` | Better Auth managed |
| Members | `profiles`, `phone_verifications` | profile = app user record, roles, onboarding, social ban, `staff_email` (e.g. `dave.staff@starcast.online`), Stripe payout account |
| Articles | `articles`, `article_likes`, `saved_articles` | `approved` gate; admin approves |
| Community | `community_categories`, `community_posts`, `post_stars`, `post_comments` (threaded via `parent_comment_id`), `comment_stars` | categories tagged per show (`show_id`, `topic` general/community) |
| Social | `friendships` (status pending/accepted), `messages` (DMs), `notifications` | notifications keyed by **profile ids** |
| Bands / artists | `bands`, `band_links`, `band_posts`, `band_post_comments`, `band_follows` | `bands.slug` → `/bands/[slug]`; `type` band/artist; owner = `owner_user_id` |
| Studio | `bookings`, `payments` | booking status requested→confirmed→checked_in→completed/cancelled; rate snapshot on booking |
| Music | `band_tracks`, `track_comments` | `band_tracks.slug` → `/music/[slug]`; `bands.music_catalog_enabled` toggle; legacy audio also in `band_posts.audio_tracks` jsonb |
| Ticketing | `band_events`, `band_ticket_orders`, `band_ticket_instances` | bands apply (`ticketing_status`), Stripe Connect payout, escrow held until 24h after event; QR via `qr_token` → `/tickets/[token]` |
| Staff ops | `productions`, `production_crew`, `production_requests`, `timesheets`, `payouts` | crew reminders via cron + SMS; staff mailbox in `/production` |
| Business | `sponsors`, `inbox_messages` | sponsor checkout via Stripe; `inbox_messages` = official staff mailbox messages (`staff_profile_id`, `to_email`) |
| Files | `uploaded_blobs` | base64 file storage (see §7) |
| (unused?) | `inbound_emails` | Postgres copy exists, but the support inbox actually uses **Firestore** |

### Making schema changes
1. Edit `lib/db/schema.ts`.
2. Apply to Neon with an idempotent script in `scripts/migrate-<feature>.js` (pattern: `pg` Pool +
   `dotenv` loading `.env.local`, `ALTER TABLE ... ADD COLUMN IF NOT EXISTS`, `CREATE TABLE IF NOT EXISTS`),
   run with `node scripts/migrate-<feature>.js` from `starcast-employee-login-2/`.
   (`npm run db:push` via drizzle-kit also exists but the scripts approach is what's been used.)
3. Update the table above.

## 7. Services & data flows

- **File uploads**: client POSTs `FormData{file, folder}` to `/api/upload` → stored base64 in
  Postgres `uploaded_blobs` (+ Netlify Blobs if available) → returns URL `/api/blobs/<folder>/<ts>-<name>`,
  served by `app/api/blobs/[...key]`. Limits: images 10MB, audio 50MB. Used for logos, banners, avatars, audio, cover art.
- **Stripe**: there are **no Stripe webhooks**. Fulfillment happens on the success page by verifying
  the Checkout session server-side: `/sponsors/success` → `verifySponsorPayment`, `/tickets/success` → `verifyAndFulfillTicketOrder`.
  Connect: `stripe-connect.ts` (staff payouts), `band-stripe-connect.ts` (band ticket payouts).
- **Email (Resend)**: outbound via `lib/email.ts`; inbound webhooks at `/api/webhooks/inbound-email`
  (→ Firestore `inbound_emails`, shown in `/admin/support`) and `/api/email/inbound` (→ Postgres `inbox_messages`).
- **SMS (Twilio)**: `sendSms`, `isSmsConfigured`, Verify helpers; status callback `/api/webhooks/twilio-status`.
- **Cron**: `/api/cron/production-reminders` protected by `CRON_SECRET` bearer.
- **Firestore** (`lib/firebase`): Admin SDK uses ADC on App Hosting or `FIREBASE_SERVICE_ACCOUNT_KEY`.
  Collections: `inbound_emails` (used), `users`, `articles` (helpers exist but the app reads these from Postgres).
- **OG images**: `/api/og`, `/api/og-band/[slug]`, `/api/og-card/[slug]`. RSS: `/rss.xml`, `/shows.xml`, `/api/rss/*`.

## 8. Code conventions

- Backend logic goes in **server actions** under `app/actions/<domain>.ts`; pages/components call them directly. Use API routes only for webhooks, uploads, cron, and non-React consumers.
- Start every protected action with the right guard from `lib/permissions.ts`.
- Call `revalidatePath(...)` after mutations that affect rendered pages.
- Import `db` from `@/lib/db` and tables from `@/lib/db/schema`; query with Drizzle (`eq`, `and`, `sql`).
- Env-dependent clients use placeholder fallbacks so `next build` succeeds without secrets — keep that pattern.
- Use `cn()` from `@/lib/utils`; reuse `components/ui/*`.

## 9. Environment variables

DB: `DATABASE_URL` / `NEON_DATABASE_URL` (must be `postgres://` wire URL — **not** Neon's Data API REST URL).
Auth: `BETTER_AUTH_SECRET`, `BETTER_AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`.
URLs: `NEXT_PUBLIC_BASE_URL`, `NEXT_PUBLIC_APP_URL`.
Stripe: `STRIPE_SECRET_KEY`, `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY`.
Resend: `RESEND_API_KEY`, `RESEND_WEBHOOK_SECRET`.
Twilio: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`, `TWILIO_VERIFY_SERVICE_SID`.
Other: `CRON_SECRET`, `PRINTIFY_API_TOKEN` (+ optional `PRINTIFY_SHOP_ID`), `FIREBASE_SERVICE_ACCOUNT_KEY` (local only).
Local values live in `starcast-employee-login-2/.env.local` (never commit/print secrets). Template: `.env.example`.
Production values: `apphosting.yaml` (+ Google Secret Manager).

## 10. Gotchas

- Don't use `scripts/*.sql` (old Supabase/RLS era) — they don't match the current schema.
- TypeScript errors don't fail the build; still run `npx tsc --noEmit` to catch real bugs.
- Netlify Blobs / Netlify env vars are absent on Firebase App Hosting — never make them required.
- `profiles.userId` ≠ `profiles.id`. Double-check which one a table expects.
- Admins bypass social bans and implicitly have every permission.
