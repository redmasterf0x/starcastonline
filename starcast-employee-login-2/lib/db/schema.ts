import {
  pgTable,
  text,
  timestamp,
  boolean,
  integer,
  numeric,
  jsonb,
  uuid,
} from "drizzle-orm/pg-core"

// --- Better Auth required tables -------------------------------------------

export const user = pgTable("user", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  email: text("email").notNull().unique(),
  emailVerified: boolean("emailVerified").notNull().default(false),
  image: text("image"),
  // Optional SMS verification (Better Auth phoneNumber plugin)
  phoneNumber: text("phoneNumber").unique(),
  phoneNumberVerified: boolean("phoneNumberVerified").notNull().default(false),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const session = pgTable("session", {
  id: text("id").primaryKey(),
  expiresAt: timestamp("expiresAt").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
  ipAddress: text("ipAddress"),
  userAgent: text("userAgent"),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
})

export const account = pgTable("account", {
  id: text("id").primaryKey(),
  accountId: text("accountId").notNull(),
  providerId: text("providerId").notNull(),
  userId: text("userId").notNull().references(() => user.id, { onDelete: "cascade" }),
  issuer: text("issuer"),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  idToken: text("idToken"),
  accessTokenExpiresAt: timestamp("accessTokenExpiresAt"),
  refreshTokenExpiresAt: timestamp("refreshTokenExpiresAt"),
  scope: text("scope"),
  password: text("password"),
  createdAt: timestamp("createdAt").notNull().defaultNow(),
  updatedAt: timestamp("updatedAt").notNull().defaultNow(),
})

export const verification = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow(),
  updatedAt: timestamp("updatedAt").defaultNow(),
})

// --- App tables ------------------------------------------------------------

export const profiles = pgTable("profiles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull(),
  email: text("email").notNull(),
  // Unique handle powering /u/<username>. Case-insensitively unique.
  username: text("username"),
  firstName: text("first_name").notNull().default(""),
  lastName: text("last_name").notNull().default(""),
  phone: text("phone"),
  phoneVerified: boolean("phone_verified").notNull().default(false),
  bio: text("bio"),
  location: text("location"),
  website: text("website"),
  profilePic: text("profile_pic"),
  interests: jsonb("interests").default([]),
  // False until the new member finishes the onboarding wizard.
  onboardingCompleted: boolean("onboarding_completed").notNull().default(false),
  // Social ban: blocks liking, commenting, posting, DMs and friend requests
  // while still allowing the member to browse and manage bookings.
  socialBanned: boolean("social_banned").notNull().default(false),
  socialBanReason: text("social_ban_reason"),
  socialBannedAt: timestamp("social_banned_at", { withTimezone: true }),
  socialBannedBy: text("social_banned_by"),
  role: text("role").notNull().default("user"),
  isEmployee: boolean("is_employee").notNull().default(false),
  isAdmin: boolean("is_admin").notNull().default(false),
  canWriteArticles: boolean("can_write_articles").notNull().default(false),
  canManageCalendar: boolean("can_manage_calendar").notNull().default(false),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  stripeAccountId: text("stripe_account_id"),
  stripeAccountStatus: text("stripe_account_status"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

/** Short-lived SMS codes used by the onboarding phone verification step. */
export const phoneVerifications = pgTable("phone_verifications", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id").notNull(),
  phone: text("phone").notNull(),
  code: text("code").notNull(),
  attempts: integer("attempts").notNull().default(0),
  consumed: boolean("consumed").notNull().default(false),
  expiresAt: timestamp("expires_at", { withTimezone: true }).notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const articles = pgTable("articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull(),
  authorId: uuid("author_id"),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  excerpt: text("excerpt"),
  externalLink: text("external_link"),
  tags: jsonb("tags").default([]),
  featured: boolean("featured").notNull().default(false),
  images: jsonb("images").default([]),
  slug: text("slug"),
  content: text("content").notNull().default(""),
  thumbnailUrl: text("thumbnail_url"),
  links: jsonb("links").default([]),
  approved: boolean("approved").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  approvedAt: timestamp("approved_at"),
})

export const articleLikes = pgTable("article_likes", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").notNull(),
  userId: text("userId").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const savedArticles = pgTable("saved_articles", {
  id: uuid("id").primaryKey().defaultRandom(),
  articleId: uuid("article_id").notNull(),
  userId: text("userId").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const communityCategories = pgTable("community_categories", {
  id: uuid("id").primaryKey().defaultRandom(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  icon: text("icon").default("💬"),
  // Each show has a "general" and a "community" topic. These columns tag a
  // category with its show so the community feed can group topics by show.
  showId: text("show_id"),
  showTitle: text("show_title"),
  topic: text("topic"), // "general" | "community"
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const communityPosts = pgTable("community_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull(),
  authorId: uuid("author_id"),
  categoryId: uuid("category_id"),
  category: text("category"),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  images: jsonb("images").default([]),
  pinned: boolean("pinned").notNull().default(false),
  upvoteCount: integer("upvote_count").notNull().default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const postStars = pgTable("post_stars", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull(),
  userId: text("userId").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const postComments = pgTable("post_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull(),
  userId: text("userId").notNull(),
  parentCommentId: uuid("parent_comment_id"),
  content: text("content").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const commentStars = pgTable("comment_stars", {
  id: uuid("id").primaryKey().defaultRandom(),
  commentId: uuid("comment_id").notNull(),
  userId: text("userId").notNull(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const friendships = pgTable("friendships", {
  id: uuid("id").primaryKey().defaultRandom(),
  requesterId: text("requester_id").notNull(),
  addresseeId: text("addressee_id").notNull(),
  status: text("status").notNull().default("pending"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const messages = pgTable("messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  senderId: text("sender_id").notNull(),
  receiverId: text("receiver_id").notNull(),
  content: text("content").notNull(),
  read: boolean("read").notNull().default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const inboxMessages = pgTable("inbox_messages", {
  id: uuid("id").primaryKey().defaultRandom(),
  resendId: text("resend_id"),
  fromEmail: text("from_email"),
  fromName: text("from_name"),
  toEmail: text("to_email"),
  subject: text("subject"),
  body: text("body"),
  textBody: text("text_body"),
  htmlBody: text("html_body"),
  isRead: boolean("is_read").notNull().default(false),
  repliedAt: timestamp("replied_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const productions = pgTable("productions", {
  id: uuid("id").primaryKey().defaultRandom(),
  title: text("title").notNull(),
  description: text("description"),
  startDate: timestamp("start_date"),
  endDate: timestamp("end_date"),
  location: text("location"),
  status: text("status").notNull().default("scheduled"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceFrequency: text("recurrence_frequency"),
  recurrenceEndDate: timestamp("recurrence_end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const productionCrew = pgTable("production_crew", {
  id: uuid("id").primaryKey().defaultRandom(),
  productionId: uuid("production_id").notNull(),
  userId: text("userId").notNull(),
  role: text("role"),
  notifiedAt: timestamp("notified_at"),
  reminderSentAt: timestamp("reminder_sent_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const productionRequests = pgTable("production_requests", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull(),
  title: text("title"),
  description: text("description"),
  requestedDate: timestamp("requested_date"),
  location: text("location"),
  status: text("status").notNull().default("pending"),
  isRecurring: boolean("is_recurring").notNull().default(false),
  recurrenceFrequency: text("recurrence_frequency"),
  recurrenceEndDate: timestamp("recurrence_end_date"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const timesheets = pgTable("timesheets", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull(),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  weekStart: text("week_start"),
  hours: jsonb("hours").default({}),
  totalHours: numeric("total_hours", { precision: 10, scale: 2 }),
  submitted: boolean("submitted").notNull().default(false),
  status: text("status").notNull().default("draft"),
  submittedAt: timestamp("submitted_at"),
  approvedAt: timestamp("approved_at"),
  payoutId: uuid("payout_id"),
  payoutAmountCents: integer("payout_amount_cents"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const payouts = pgTable("payouts", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("userId").notNull(),
  timesheetId: uuid("timesheet_id"),
  amount: numeric("amount", { precision: 10, scale: 2 }),
  amountCents: integer("amount_cents"),
  hours: numeric("hours", { precision: 10, scale: 2 }),
  hourlyRate: numeric("hourly_rate", { precision: 10, scale: 2 }),
  periodStart: text("period_start"),
  periodEnd: text("period_end"),
  status: text("status").notNull().default("pending"),
  stripeTransferId: text("stripe_transfer_id"),
  approvedBy: text("approved_by"),
  approvedAt: timestamp("approved_at"),
  paidAt: timestamp("paid_at"),
  notes: text("notes"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

export const sponsors = pgTable("sponsors", {
  id: uuid("id").primaryKey().defaultRandom(),
  userId: text("user_id"),
  packageId: text("package_id"),
  packageName: text("package_name"),
  amountCents: integer("amount_cents"),
  companyName: text("company_name"),
  companyEmail: text("company_email"),
  contactName: text("contact_name"),
  contactPhone: text("contact_phone"),
  websiteUrl: text("website_url"),
  socialFacebook: text("social_facebook"),
  socialInstagram: text("social_instagram"),
  socialTwitter: text("social_twitter"),
  socialLinkedin: text("social_linkedin"),
  commercialUrl: text("commercial_url"),
  logoUrl: text("logo_url"),
  stripeSessionId: text("stripe_session_id"),
  stripeSubscriptionId: text("stripe_subscription_id"),
  stripeCustomerId: text("stripe_customer_id"),
  tier: text("tier"),
  name: text("name").notNull().default(""),
  status: text("status").notNull().default("active"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
})

// --- Studio booking system -------------------------------------------------

export const bands = pgTable("bands", {
  id: uuid("id").primaryKey().defaultRandom(),
  ownerUserId: text("owner_user_id").notNull(),
  name: text("name").notNull(),
  // Page kind: "band" (group) or "artist" (solo). Controls labels/copy.
  type: text("type").notNull().default("band"),
  // URL identifier for the public page at /bands/<slug>. Unique.
  slug: text("slug"),
  // Public pages are shareable at /bands/<slug> when true.
  isPublic: boolean("is_public").notNull().default(true),
  genre: text("genre"),
  bio: text("bio"),
  contactEmail: text("contact_email"),
  contactPhone: text("contact_phone"),
  logoUrl: text("logo_url"),
  hasActivePass: boolean("has_active_pass").notNull().default(false),
  passExpiresAt: timestamp("pass_expires_at", { withTimezone: true }),
  youtubeAgreementSigned: boolean("youtube_agreement_signed").notNull().default(false),
  youtubeAgreementSignedAt: timestamp("youtube_agreement_signed_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const bandPosts = pgTable("band_posts", {
  id: uuid("id").primaryKey().defaultRandom(),
  bandId: uuid("band_id").notNull(),
  authorUserId: text("author_user_id").notNull(),
  content: text("content").notNull().default(""),
  images: jsonb("images").default([]),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

// A user following a band's page. Followers see the band's posts surfaced in
// the Community "Bands" tab feed without having to visit the page directly.
export const bandFollows = pgTable("band_follows", {
  id: uuid("id").primaryKey().defaultRandom(),
  bandId: uuid("band_id").notNull(),
  userId: text("user_id").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const bandPostComments = pgTable("band_post_comments", {
  id: uuid("id").primaryKey().defaultRandom(),
  postId: uuid("post_id").notNull(),
  bandId: uuid("band_id").notNull(),
  userId: text("user_id").notNull(),
  content: text("content").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
})

export const bookings = pgTable("bookings", {
  id: uuid("id").primaryKey().defaultRandom(),
  bandId: uuid("band_id").notNull(),
  createdByUserId: text("created_by_user_id").notNull(),
  title: text("title"),
  startsAt: timestamp("starts_at", { withTimezone: true }).notNull(),
  endsAt: timestamp("ends_at", { withTimezone: true }).notNull(),
  // requested | confirmed | checked_in | completed | cancelled
  status: text("status").notNull().default("requested"),
  // Rate snapshot: the price at time of booking, so past bookings never change
  // when the studio's default rate is later adjusted.
  hourlyRateCharged: numeric("hourly_rate_charged", { precision: 10, scale: 2 }).notNull().default("0"),
  hours: numeric("hours", { precision: 6, scale: 2 }).notNull().default("0"),
  totalAmount: numeric("total_amount", { precision: 10, scale: 2 }).notNull().default("0"),
  notes: text("notes"),
  checkedInAt: timestamp("checked_in_at", { withTimezone: true }),
  checkedOutAt: timestamp("checked_out_at", { withTimezone: true }),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})

export const payments = pgTable("payments", {
  id: uuid("id").primaryKey().defaultRandom(),
  bookingId: uuid("booking_id"),
  bandId: uuid("band_id").notNull(),
  loggedByUserId: text("logged_by_user_id").notNull(),
  amount: numeric("amount", { precision: 10, scale: 2 }).notNull().default("0"),
  // cash | venmo | paypal | stripe | other
  method: text("method").notNull().default("cash"),
  // pending | paid | refunded | void
  status: text("status").notNull().default("pending"),
  // booking | pass | other
  kind: text("kind").notNull().default("booking"),
  paidAt: timestamp("paid_at", { withTimezone: true }),
  note: text("note"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
})
