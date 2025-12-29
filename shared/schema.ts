import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, decimal, json, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Express session table (used by connect-pg-simple)
export const userSessions = pgTable("user_sessions", {
  sid: varchar("sid").primaryKey(),
  sess: json("sess").notNull(),
  expire: timestamp("expire", { withTimezone: false }).notNull(),
});

// Admins table - separate from users
export const admins = pgTable("admins", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  fullName: text("full_name").notNull(),
  role: text("role").notNull().default("full"), // "full" = full admin access, "video" = video management only
  currentSessionId: text("current_session_id"),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())`),
});

export const insertAdminSchema = createInsertSchema(admins).omit({
  id: true,
  currentSessionId: true,
  createdAt: true,
}).extend({
  username: z.string().min(3, "Username must be at least 3 characters"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type InsertAdmin = z.infer<typeof insertAdminSchema>;
export type Admin = typeof admins.$inferSelect;

export const users = pgTable("users", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  fullName: text("full_name").notNull(),
  phoneNumber: text("phone_number").unique(), // Optional - user can register with phone OR email
  email: text("email").unique(), // Optional - user can register with phone OR email
  password: text("password").notNull(),
  isAdmin: integer("is_admin").notNull().default(0),
  adminRole: text("admin_role"), // "full" = full admin access, "video" = video management only, null = regular user
  currentSessionId: text("current_session_id"), // Track active session for single-device login
  balance: decimal("balance", { precision: 10, scale: 2 }).notNull().default("0.00"), // User credit balance in USD
  trustedUser: integer("trusted_user").notNull().default(0), // 1 = skip DevTools detection, 0 = normal security
  noWatermark: integer("no_watermark").notNull().default(0), // 1 = remove watermark from videos, 0 = show watermark
});

export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  isAdmin: true,
  adminRole: true,
  currentSessionId: true,
  balance: true,
}).extend({
  phoneNumber: z.string()
    .regex(/^(\+855|855|0)?\d{8,9}$/, "Phone number must be 8-9 digits (with or without +855/855/0 prefix)")
    .transform((val) => {
      const digitsOnly = val.replace(/^(\+855|855|0)/, '');
      if (digitsOnly.length < 8 || digitsOnly.length > 9) {
        throw new Error("Phone number must be 8-9 digits");
      }
      return `+855${digitsOnly}`;
    })
    .optional()
    .nullable(),
  email: z.string().email("Invalid email address").optional().nullable(),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

// Pending Email Registrations - for OTP verification
export const pendingEmailRegistrations = pgTable("pending_email_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  email: text("email").notNull().unique(),
  fullName: text("full_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  otpHash: text("otp_hash").notNull(),
  otpExpiresAt: integer("otp_expires_at").notNull(), // Unix timestamp
  attemptCount: integer("attempt_count").notNull().default(0),
  resendCount: integer("resend_count").notNull().default(0),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())`),
});

export const insertPendingEmailRegistrationSchema = createInsertSchema(pendingEmailRegistrations).omit({
  id: true,
  attemptCount: true,
  resendCount: true,
  createdAt: true,
});

export type InsertPendingEmailRegistration = z.infer<typeof insertPendingEmailRegistrationSchema>;
export type PendingEmailRegistration = typeof pendingEmailRegistrations.$inferSelect;

// Pending Phone Registrations - for SMS OTP verification
export const pendingPhoneRegistrations = pgTable("pending_phone_registrations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  phoneNumber: text("phone_number").notNull().unique(),
  fullName: text("full_name").notNull(),
  passwordHash: text("password_hash").notNull(),
  otpHash: text("otp_hash").notNull(),
  otpExpiresAt: integer("otp_expires_at").notNull(), // Unix timestamp
  attemptCount: integer("attempt_count").notNull().default(0),
  resendCount: integer("resend_count").notNull().default(0),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())`),
});

export const insertPendingPhoneRegistrationSchema = createInsertSchema(pendingPhoneRegistrations).omit({
  id: true,
  attemptCount: true,
  resendCount: true,
  createdAt: true,
});

export type InsertPendingPhoneRegistration = z.infer<typeof insertPendingPhoneRegistrationSchema>;
export type PendingPhoneRegistration = typeof pendingPhoneRegistrations.$inferSelect;

// Pending Password Resets - for forgot password OTP verification
export const pendingPasswordResets = pgTable("pending_password_resets", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull(),
  email: text("email"),
  phoneNumber: text("phone_number"),
  otpHash: text("otp_hash").notNull(),
  otpExpiresAt: integer("otp_expires_at").notNull(),
  attemptCount: integer("attempt_count").notNull().default(0),
  resendCount: integer("resend_count").notNull().default(0),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())`),
});

export const insertPendingPasswordResetSchema = createInsertSchema(pendingPasswordResets).omit({
  id: true,
  attemptCount: true,
  resendCount: true,
  createdAt: true,
});

export type InsertPendingPasswordReset = z.infer<typeof insertPendingPasswordResetSchema>;
export type PendingPasswordReset = typeof pendingPasswordResets.$inferSelect;

export const movies = pgTable("movies", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  title: text("title").notNull(),
  description: text("description").notNull(),
  rating: decimal("rating", { precision: 3, scale: 1 }).notNull(),
  imdbRating: decimal("imdb_rating", { precision: 3, scale: 1 }),
  tmdbRating: decimal("tmdb_rating", { precision: 3, scale: 1 }),
  year: integer("year").notNull(),
  duration: text("duration").notNull(),
  genres: text("genres").array().notNull(),
  cast: text("cast").array().notNull(),
  director: text("director").notNull(),
  country: text("country").notNull().default("USA"),
  posterImage: text("poster_image").notNull(),
  backdropImage: text("backdrop_image").notNull(),
  videoEmbedUrl: text("video_embed_url"),
  trailerUrl: text("trailer_url"),
  isFree: integer("is_free").notNull().default(0),
  price: decimal("price", { precision: 10, scale: 2 }).notNull().default("1.00"), // Custom price per movie in USD
  isTrending: integer("is_trending").notNull().default(0),
  isNewAndPopular: integer("is_new_and_popular").notNull().default(0),
  isHeroBanner: integer("is_hero_banner").notNull().default(0),
  userRatingAvg: decimal("user_rating_avg", { precision: 3, scale: 1 }).default("0"),
  userRatingCount: integer("user_rating_count").notNull().default(0),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())`), // Sort new videos first
});

export const insertMovieSchema = createInsertSchema(movies).omit({
  id: true,
  createdAt: true,
});

export type InsertMovie = z.infer<typeof insertMovieSchema>;
export type Movie = typeof movies.$inferSelect;

// My List - user's saved movies
export const myList = pgTable("my_list", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  movieId: varchar("movie_id").notNull().references(() => movies.id, { onDelete: 'cascade' }),
  addedAt: integer("added_at").notNull().default(sql`extract(epoch from now())`),
});

export const insertMyListSchema = createInsertSchema(myList).omit({
  id: true,
  addedAt: true,
});

export type InsertMyList = z.infer<typeof insertMyListSchema>;
export type MyList = typeof myList.$inferSelect;

// Movie User Ratings - user ratings for movies
export const movieUserRatings = pgTable("movie_user_ratings", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  movieId: varchar("movie_id").notNull().references(() => movies.id, { onDelete: 'cascade' }),
  score: decimal("score", { precision: 3, scale: 1 }).notNull(), // 1-10 rating
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())`),
  updatedAt: integer("updated_at").notNull().default(sql`extract(epoch from now())`),
});

export const insertMovieUserRatingSchema = createInsertSchema(movieUserRatings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type InsertMovieUserRating = z.infer<typeof insertMovieUserRatingSchema>;
export type MovieUserRating = typeof movieUserRatings.$inferSelect;

// Subscription Plans
export const subscriptionPlans = pgTable("subscription_plans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(), // Free, Basic, Premium
  displayName: text("display_name").notNull(), // Free Plan, Basic Plan, Premium Plan
  price: decimal("price", { precision: 10, scale: 2 }).notNull(), // Monthly price in USD
  currency: text("currency").notNull().default("USD"),
  features: text("features").array().notNull(), // List of features
  maxMovies: integer("max_movies"), // null = unlimited
  isActive: integer("is_active").notNull().default(1),
});

export const insertSubscriptionPlanSchema = createInsertSchema(subscriptionPlans).omit({
  id: true,
});

export type InsertSubscriptionPlan = z.infer<typeof insertSubscriptionPlanSchema>;
export type SubscriptionPlan = typeof subscriptionPlans.$inferSelect;

// User Subscriptions
export const userSubscriptions = pgTable("user_subscriptions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  status: text("status").notNull().default("active"), // active, cancelled, expired
  startDate: integer("start_date").notNull().default(sql`extract(epoch from now())`),
  endDate: integer("end_date"), // null for lifetime/free plans
  autoRenew: integer("auto_renew").notNull().default(1),
});

export const insertUserSubscriptionSchema = createInsertSchema(userSubscriptions).omit({
  id: true,
  startDate: true,
});

export type InsertUserSubscription = z.infer<typeof insertUserSubscriptionSchema>;
export type UserSubscription = typeof userSubscriptions.$inferSelect;

// Payment Transactions
export const paymentTransactions = pgTable("payment_transactions", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  subscriptionId: varchar("subscription_id").references(() => userSubscriptions.id),
  planId: varchar("plan_id").notNull().references(() => subscriptionPlans.id),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  status: text("status").notNull().default("pending"), // pending, completed, failed, refunded
  paymentMethod: text("payment_method").notNull().default("raksmeypay"),
  transactionRef: text("transaction_ref"), // RaksemeyPay transaction reference
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())`),
  completedAt: integer("completed_at"),
});

export const insertPaymentTransactionSchema = createInsertSchema(paymentTransactions).omit({
  id: true,
  createdAt: true,
});

export type InsertPaymentTransaction = z.infer<typeof insertPaymentTransactionSchema>;
export type PaymentTransaction = typeof paymentTransactions.$inferSelect;

// Movie Views - track individual movie views
export const movieViews = pgTable("movie_views", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  movieId: varchar("movie_id").notNull().references(() => movies.id, { onDelete: 'cascade' }),
  viewedAt: integer("viewed_at").notNull().default(sql`extract(epoch from now())`),
  watchDuration: integer("watch_duration").notNull().default(0), // seconds watched
});

export const insertMovieViewSchema = createInsertSchema(movieViews).omit({
  id: true,
  viewedAt: true,
});

export type InsertMovieView = z.infer<typeof insertMovieViewSchema>;
export type MovieView = typeof movieViews.$inferSelect;

// Video Purchases - track individual video purchases (pay-per-view)
export const videoPurchases = pgTable("video_purchases", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  movieId: varchar("movie_id").notNull().references(() => movies.id, { onDelete: 'cascade' }),
  amount: decimal("amount", { precision: 10, scale: 2 }).notNull(),
  currency: text("currency").notNull().default("USD"),
  transactionRef: text("transaction_ref"), // RaksemeyPay transaction reference
  purchasedAt: integer("purchased_at").notNull().default(sql`extract(epoch from now())`),
});

export const insertVideoPurchaseSchema = createInsertSchema(videoPurchases).omit({
  id: true,
  purchasedAt: true,
});

export type InsertVideoPurchase = z.infer<typeof insertVideoPurchaseSchema>;
export type VideoPurchase = typeof videoPurchases.$inferSelect;

// Ad Banners
export const adBanners = pgTable("ad_banners", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  name: text("name").notNull(),
  imageUrl: text("image_url").notNull(),
  linkUrl: text("link_url").notNull(),
  position: text("position").notNull().default("top"), // "top" or "bottom"
  isActive: integer("is_active").notNull().default(1),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())`),
});

export const insertAdBannerSchema = createInsertSchema(adBanners).omit({
  id: true,
  createdAt: true,
});

export type InsertAdBanner = z.infer<typeof insertAdBannerSchema>;
export type AdBanner = typeof adBanners.$inferSelect;

// Security Violations - track user security violations
export const securityViolations = pgTable("security_violations", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  violationType: text("violation_type").notNull(), // devtools, screen_share, tab_switch, copy_attempt, right_click
  severity: text("severity").notNull().default("low"), // low, medium, high, critical
  description: text("description"),
  userAgent: text("user_agent"),
  ipAddress: text("ip_address"),
  movieId: varchar("movie_id").references(() => movies.id, { onDelete: 'set null' }),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())`),
});

export const insertSecurityViolationSchema = createInsertSchema(securityViolations).omit({
  id: true,
  createdAt: true,
});

export type InsertSecurityViolation = z.infer<typeof insertSecurityViolationSchema>;
export type SecurityViolation = typeof securityViolations.$inferSelect;

// User Bans - track banned users
export const userBans = pgTable("user_bans", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  banType: text("ban_type").notNull().default("temporary"), // temporary, permanent
  reason: text("reason").notNull(),
  violationId: varchar("violation_id").references(() => securityViolations.id, { onDelete: 'set null' }),
  bannedAt: integer("banned_at").notNull().default(sql`extract(epoch from now())`),
  expiresAt: integer("expires_at"), // null for permanent bans
  isActive: integer("is_active").notNull().default(1),
});

export const insertUserBanSchema = createInsertSchema(userBans).omit({
  id: true,
  bannedAt: true,
});

export type InsertUserBan = z.infer<typeof insertUserBanSchema>;
export type UserBan = typeof userBans.$inferSelect;

// Daily Watch Time - track user's daily video watch time
export const dailyWatchTime = pgTable("daily_watch_time", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  date: text("date").notNull(), // YYYY-MM-DD format
  totalSeconds: integer("total_seconds").notNull().default(0),
  playAttempts: integer("play_attempts").notNull().default(0),
  lastUpdated: integer("last_updated").notNull().default(sql`extract(epoch from now())`),
});

export const insertDailyWatchTimeSchema = createInsertSchema(dailyWatchTime).omit({
  id: true,
  lastUpdated: true,
});

export type InsertDailyWatchTime = z.infer<typeof insertDailyWatchTimeSchema>;
export type DailyWatchTime = typeof dailyWatchTime.$inferSelect;

// Video Access Tokens - token-based video access
export const videoAccessTokens = pgTable("video_access_tokens", {
  id: varchar("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: varchar("user_id").notNull().references(() => users.id, { onDelete: 'cascade' }),
  movieId: varchar("movie_id").notNull().references(() => movies.id, { onDelete: 'cascade' }),
  token: text("token").notNull().unique(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
  createdAt: integer("created_at").notNull().default(sql`extract(epoch from now())`),
  expiresAt: integer("expires_at").notNull(),
  used: integer("used").notNull().default(0),
});
