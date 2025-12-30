import { type User, type InsertUser, type Movie, type InsertMovie, type MyList, type InsertMyList, type SubscriptionPlan, type UserSubscription, type InsertUserSubscription, type PaymentTransaction, type InsertPaymentTransaction, type MovieView, type InsertMovieView, type VideoPurchase, type InsertVideoPurchase, type AdBanner, type InsertAdBanner, type SecurityViolation, type InsertSecurityViolation, type UserBan, type InsertUserBan, type DailyWatchTime, type InsertDailyWatchTime, type Admin, type InsertAdmin, type PendingEmailRegistration, type PendingPhoneRegistration, type PendingPasswordReset, type MovieUserRating, type CreditTransaction, type InsertCreditTransaction, users, movies, myList, subscriptionPlans, userSubscriptions, paymentTransactions, movieViews, videoPurchases, adBanners, securityViolations, userBans, dailyWatchTime, videoAccessTokens, admins, pendingEmailRegistrations, pendingPhoneRegistrations, pendingPasswordResets, movieUserRatings, creditTransactions } from "@shared/schema";
import { randomUUID } from "crypto";
import { drizzle } from "drizzle-orm/node-postgres";
import pg from "pg";
import { eq, ilike, or, sql, and } from "drizzle-orm";

const { Pool } = pg;

// Type for user updates that includes session management fields and avatar
type UserUpdateData = Partial<InsertUser> & { currentSessionId?: string | null; avatarUrl?: string };

export interface IStorage {
  // User methods
  getUser(id: string): Promise<User | undefined>;
  getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: string, user: UserUpdateData): Promise<User | undefined>;
  updateUserBalance(id: string, balance: string): Promise<User | undefined>;
  updateUserTrustedStatus(id: string, trusted: number): Promise<User | undefined>;
  updateUserNoWatermarkStatus(id: string, noWatermark: number): Promise<User | undefined>;
  deleteUser(id: string): Promise<boolean>;
  
  // Movie methods
  getAllMovies(page?: number, limit?: number): Promise<{ movies: Movie[], total: number }>;
  getMovieById(id: string): Promise<Movie | undefined>;
  getMoviesByGenre(genre: string, page?: number, limit?: number): Promise<{ movies: Movie[], total: number }>;
  getTrendingMovies(page?: number, limit?: number): Promise<{ movies: Movie[], total: number }>;
  getNewAndPopularMovies(page?: number, limit?: number): Promise<{ movies: Movie[], total: number }>;
  getHeroBannerMovie(): Promise<Movie | undefined>;
  searchMovies(query: string, page?: number, limit?: number): Promise<{ movies: Movie[], total: number }>;
  createMovie(movie: InsertMovie): Promise<Movie>;
  updateMovie(id: string, movie: Partial<InsertMovie>): Promise<Movie | undefined>;
  deleteMovie(id: string): Promise<boolean>;
  
  // My List methods
  getUserMyList(userId: string, page?: number, limit?: number): Promise<{ movies: Movie[], total: number }>;
  addToMyList(userId: string, movieId: string): Promise<MyList>;
  removeFromMyList(userId: string, movieId: string): Promise<boolean>;
  isInMyList(userId: string, movieId: string): Promise<boolean>;
  
  // Subscription methods
  getSubscriptionPlans(): Promise<SubscriptionPlan[]>;
  getMonthlyPlan(): Promise<SubscriptionPlan | undefined>;
  getUserSubscription(userId: string): Promise<UserSubscription | undefined>;
  createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription>;
  updateUserSubscription(id: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined>;
  isUserSubscribed(userId: string): Promise<boolean>;
  
  // Payment methods
  createPaymentTransaction(payment: InsertPaymentTransaction): Promise<PaymentTransaction>;
  updatePaymentTransaction(id: string, data: Partial<InsertPaymentTransaction>): Promise<PaymentTransaction | undefined>;
  getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined>;
  getPaymentTransactionByRef(transactionRef: string): Promise<PaymentTransaction | undefined>;
  
  // Video Purchase methods (pay-per-view)
  hasUserPurchasedVideo(userId: string, movieId: string): Promise<boolean>;
  createVideoPurchase(purchase: InsertVideoPurchase): Promise<VideoPurchase>;
  getUserPurchasedVideos(userId: string): Promise<Movie[]>;
  getMoviesWithCreditPurchase(): Promise<Movie[]>;
  
  // Analytics methods
  trackMovieView(view: InsertMovieView): Promise<MovieView>;
  getAnalytics(): Promise<{
    totalUsers: number;
    totalSubscribers: number;
    activeSubscribers: number;
    newSubscribersThisMonth: number;
    lostSubscribersThisMonth: number;
    totalRevenue: number;
    revenueThisMonth: number;
    totalMovieViews: number;
    totalWatchTimeHours: number;
    averageWatchTimeMinutes: number;
  }>;
  getTopMovies(limit?: number): Promise<Array<{ movie: Movie; views: number; totalWatchTime: number }>>;
  getTopGenres(limit?: number): Promise<Array<{ genre: string; views: number }>>;
  getRevenueByMonth(months?: number): Promise<Array<{ month: string; revenue: number; subscribers: number }>>;
  getPaymentIssues(): Promise<Array<PaymentTransaction>>;
  getRecentActivity(limit?: number): Promise<Array<{ type: string; data: any; timestamp: number }>>;
  
  // Ad Banner methods
  getAllAdBanners(): Promise<AdBanner[]>;
  getActiveAdBanners(): Promise<AdBanner[]>;
  getAdBanner(id: string): Promise<AdBanner | undefined>;
  createAdBanner(banner: InsertAdBanner): Promise<AdBanner>;
  updateAdBanner(id: string, banner: Partial<InsertAdBanner>): Promise<AdBanner | undefined>;
  deleteAdBanner(id: string): Promise<boolean>;

  // Security methods
  createSecurityViolation(violation: InsertSecurityViolation): Promise<SecurityViolation>;
  getUserViolationCount(userId: string, violationType: string, hoursBack: number): Promise<number>;
  getUserViolations(userId: string, limit: number): Promise<SecurityViolation[]>;
  getAllViolations(limit: number): Promise<SecurityViolation[]>;
  
  // Ban methods
  createUserBan(ban: InsertUserBan): Promise<UserBan>;
  getActiveUserBan(userId: string): Promise<UserBan | undefined>;
  deactivateUserBan(id: string): Promise<void>;
  deactivateAllUserBans(userId: string): Promise<void>;
  getAllBans(limit: number): Promise<UserBan[]>;
  
  // Watch time methods
  getDailyWatchTime(userId: string, date: string): Promise<DailyWatchTime | undefined>;
  updateDailyWatchTime(userId: string, date: string, secondsWatched: number): Promise<void>;
  incrementPlayAttempts(userId: string, date: string): Promise<void>;
  
  // Video token methods
  createVideoAccessToken(data: { userId: string; movieId: string; token: string; ipAddress?: string; userAgent?: string; expiresAt: number }): Promise<void>;
  getVideoAccessToken(token: string): Promise<{ userId: string; movieId: string; token: string; ipAddress?: string; expiresAt: number; used: number } | undefined>;
  markVideoTokenUsed(token: string): Promise<void>;
  
  // Admin methods
  getAdmin(id: string): Promise<Admin | undefined>;
  getAdminByUsername(username: string): Promise<Admin | undefined>;
  getAllAdmins(): Promise<Admin[]>;
  createAdmin(admin: InsertAdmin): Promise<Admin>;
  updateAdmin(id: string, admin: Partial<InsertAdmin> & { currentSessionId?: string | null }): Promise<Admin | undefined>;
  deleteAdmin(id: string): Promise<boolean>;
  
  // Pending Email Registration methods (OTP verification)
  getPendingEmailRegistration(email: string): Promise<PendingEmailRegistration | undefined>;
  createPendingEmailRegistration(data: { email: string; fullName: string; passwordHash: string; otpHash: string; otpExpiresAt: number }): Promise<PendingEmailRegistration>;
  updatePendingEmailRegistration(email: string, data: Partial<{ otpHash: string; otpExpiresAt: number; attemptCount: number; resendCount: number }>): Promise<PendingEmailRegistration | undefined>;
  deletePendingEmailRegistration(email: string): Promise<boolean>;
  
  // Pending Phone Registration methods (SMS OTP verification)
  getPendingPhoneRegistration(phoneNumber: string): Promise<PendingPhoneRegistration | undefined>;
  createPendingPhoneRegistration(data: { phoneNumber: string; fullName: string; passwordHash: string; otpHash: string; otpExpiresAt: number }): Promise<PendingPhoneRegistration>;
  updatePendingPhoneRegistration(phoneNumber: string, data: Partial<{ otpHash: string; otpExpiresAt: number; attemptCount: number; resendCount: number }>): Promise<PendingPhoneRegistration | undefined>;
  deletePendingPhoneRegistration(phoneNumber: string): Promise<boolean>;
  
  // Pending Password Reset methods (forgot password OTP verification)
  getPendingPasswordReset(userId: string): Promise<PendingPasswordReset | undefined>;
  createPendingPasswordReset(data: { userId: string; email?: string; phoneNumber?: string; otpHash: string; otpExpiresAt: number }): Promise<PendingPasswordReset>;
  updatePendingPasswordReset(userId: string, data: Partial<{ otpHash: string; otpExpiresAt: number; attemptCount: number; resendCount: number }>): Promise<PendingPasswordReset | undefined>;
  deletePendingPasswordReset(userId: string): Promise<boolean>;
  
  // Movie User Rating methods
  getUserMovieRating(userId: string, movieId: string): Promise<MovieUserRating | undefined>;
  submitUserMovieRating(userId: string, movieId: string, score: number): Promise<MovieUserRating>;
  getMovieRatingStats(movieId: string): Promise<{ average: number; count: number }>;
  
  // Credit Transaction methods
  createCreditTransaction(data: InsertCreditTransaction): Promise<CreditTransaction>;
  getUserCreditTransactions(userId: string, limit?: number): Promise<CreditTransaction[]>;
  addUserCredits(userId: string, amount: number, type: string, description: string, adminId?: string): Promise<{ user: User; transaction: CreditTransaction }>;
  deductUserCredits(userId: string, amount: number, description: string, movieId?: string): Promise<{ user: User; transaction: CreditTransaction }>;
  getAllCreditTransactions(limit?: number): Promise<CreditTransaction[]>;
  
  // App Settings methods
  getAppSetting(key: string): Promise<string | undefined>;
  setAppSetting(key: string, value: string, description?: string, adminId?: string): Promise<void>;
  getAllAppSettings(): Promise<Array<{ key: string; value: string; description: string | null; updatedAt: number }>>;
}

export class DatabaseStorage implements IStorage {
  private db;

  constructor(connectionString: string) {
    const pool = new Pool({ connectionString });
    this.db = drizzle(pool);
  }

  async getUser(id: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.id, id));
    return result[0];
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.phoneNumber, phoneNumber));
    return result[0];
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const result = await this.db.select().from(users).where(eq(users.email, email));
    return result[0];
  }

  async getAllUsers(): Promise<User[]> {
    return await this.db.select().from(users);
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const result = await this.db.insert(users).values(insertUser).returning();
    return result[0];
  }

  async updateUser(id: string, updateData: UserUpdateData): Promise<User | undefined> {
    const result = await this.db.update(users).set(updateData).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserBalance(id: string, balance: string): Promise<User | undefined> {
    const result = await this.db.update(users).set({ balance }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserTrustedStatus(id: string, trusted: number): Promise<User | undefined> {
    const result = await this.db.update(users).set({ trustedUser: trusted }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async updateUserNoWatermarkStatus(id: string, noWatermark: number): Promise<User | undefined> {
    const result = await this.db.update(users).set({ noWatermark: noWatermark }).where(eq(users.id, id)).returning();
    return result[0];
  }

  async deleteUser(id: string): Promise<boolean> {
    const result = await this.db.delete(users).where(eq(users.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async getAllMovies(page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const offset = (page - 1) * limit;
    const [moviesResult, countResult] = await Promise.all([
      this.db.select().from(movies).orderBy(sql`${movies.createdAt} DESC NULLS LAST`).limit(limit).offset(offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(movies)
    ]);
    return { movies: moviesResult, total: countResult[0].count };
  }

  async getMovieById(id: string): Promise<Movie | undefined> {
    const result = await this.db.select().from(movies).where(eq(movies.id, id));
    return result[0];
  }

  async getMoviesByGenre(genre: string, page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const offset = (page - 1) * limit;
    const genreCondition = sql`${genre} = ANY(${movies.genres})`;
    const [moviesResult, countResult] = await Promise.all([
      this.db.select().from(movies).where(genreCondition).orderBy(sql`${movies.createdAt} DESC NULLS LAST`).limit(limit).offset(offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(movies).where(genreCondition)
    ]);
    return { movies: moviesResult, total: countResult[0].count };
  }

  async getTrendingMovies(page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const offset = (page - 1) * limit;
    const [moviesResult, countResult] = await Promise.all([
      this.db.select().from(movies).where(eq(movies.isTrending, 1)).orderBy(sql`${movies.createdAt} DESC NULLS LAST`).limit(limit).offset(offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(movies).where(eq(movies.isTrending, 1))
    ]);
    return { movies: moviesResult, total: countResult[0].count };
  }

  async getNewAndPopularMovies(page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const offset = (page - 1) * limit;
    const [moviesResult, countResult] = await Promise.all([
      this.db.select().from(movies).where(eq(movies.isNewAndPopular, 1)).orderBy(sql`${movies.createdAt} DESC NULLS LAST`).limit(limit).offset(offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(movies).where(eq(movies.isNewAndPopular, 1))
    ]);
    return { movies: moviesResult, total: countResult[0].count };
  }

  async getHeroBannerMovie(): Promise<Movie | undefined> {
    const result = await this.db.select().from(movies).where(eq(movies.isHeroBanner, 1)).limit(1);
    return result[0];
  }

  async searchMovies(query: string, page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const lowerQuery = `%${query.toLowerCase()}%`;
    const searchCondition = or(
      ilike(movies.title, lowerQuery),
      ilike(movies.description, lowerQuery)
    );
    const offset = (page - 1) * limit;
    const [moviesResult, countResult] = await Promise.all([
      this.db.select().from(movies).where(searchCondition).orderBy(sql`${movies.createdAt} DESC NULLS LAST`).limit(limit).offset(offset),
      this.db.select({ count: sql<number>`count(*)::int` }).from(movies).where(searchCondition)
    ]);
    return { movies: moviesResult, total: countResult[0].count };
  }

  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const result = await this.db.insert(movies).values(insertMovie).returning();
    return result[0];
  }

  async updateMovie(id: string, updateData: Partial<InsertMovie>): Promise<Movie | undefined> {
    const result = await this.db.update(movies)
      .set(updateData)
      .where(eq(movies.id, id))
      .returning();
    return result[0];
  }

  async deleteMovie(id: string): Promise<boolean> {
    const result = await this.db.delete(movies).where(eq(movies.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // My List methods
  async getUserMyList(userId: string, page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const offset = (page - 1) * limit;
    const [moviesResult, countResult] = await Promise.all([
      this.db.select({ movie: movies })
        .from(myList)
        .innerJoin(movies, eq(myList.movieId, movies.id))
        .where(eq(myList.userId, userId))
        .limit(limit)
        .offset(offset),
      this.db.select({ count: sql<number>`count(*)::int` })
        .from(myList)
        .where(eq(myList.userId, userId))
    ]);
    return {
      movies: moviesResult.map(r => r.movie),
      total: countResult[0].count
    };
  }

  async addToMyList(userId: string, movieId: string): Promise<MyList> {
    const result = await this.db.insert(myList).values({ userId, movieId }).returning();
    return result[0];
  }

  async removeFromMyList(userId: string, movieId: string): Promise<boolean> {
    const result = await this.db.delete(myList)
      .where(and(eq(myList.userId, userId), eq(myList.movieId, movieId)));
    return result.rowCount !== null && result.rowCount > 0;
  }

  async isInMyList(userId: string, movieId: string): Promise<boolean> {
    const result = await this.db.select()
      .from(myList)
      .where(and(eq(myList.userId, userId), eq(myList.movieId, movieId)))
      .limit(1);
    return result.length > 0;
  }

  // Subscription methods
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return await this.db.select().from(subscriptionPlans).where(eq(subscriptionPlans.isActive, 1));
  }

  async getMonthlyPlan(): Promise<SubscriptionPlan | undefined> {
    const result = await this.db.select().from(subscriptionPlans)
      .where(and(eq(subscriptionPlans.name, 'monthly'), eq(subscriptionPlans.isActive, 1)))
      .limit(1);
    return result[0];
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    const result = await this.db.select().from(userSubscriptions)
      .where(eq(userSubscriptions.userId, userId))
      .orderBy(sql`${userSubscriptions.startDate} DESC`)
      .limit(1);
    return result[0];
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    const result = await this.db.insert(userSubscriptions).values(subscription).returning();
    return result[0];
  }

  async updateUserSubscription(id: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined> {
    const result = await this.db.update(userSubscriptions).set(data).where(eq(userSubscriptions.id, id)).returning();
    return result[0];
  }

  async isUserSubscribed(userId: string): Promise<boolean> {
    const subscription = await this.getUserSubscription(userId);
    if (!subscription) return false;
    if (subscription.status !== 'active') return false;
    if (!subscription.endDate) return true; // lifetime subscription
    
    const now = Math.floor(Date.now() / 1000);
    return subscription.endDate > now;
  }

  // Payment methods
  async createPaymentTransaction(payment: InsertPaymentTransaction): Promise<PaymentTransaction> {
    const result = await this.db.insert(paymentTransactions).values(payment).returning();
    return result[0];
  }

  async updatePaymentTransaction(id: string, data: Partial<InsertPaymentTransaction>): Promise<PaymentTransaction | undefined> {
    const result = await this.db.update(paymentTransactions).set(data).where(eq(paymentTransactions.id, id)).returning();
    return result[0];
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    const result = await this.db.select().from(paymentTransactions).where(eq(paymentTransactions.id, id));
    return result[0];
  }

  async getPaymentTransactionByRef(transactionRef: string): Promise<PaymentTransaction | undefined> {
    const result = await this.db.select().from(paymentTransactions).where(eq(paymentTransactions.transactionRef, transactionRef));
    return result[0];
  }

  // Video Purchase methods (pay-per-view)
  async hasUserPurchasedVideo(userId: string, movieId: string): Promise<boolean> {
    const result = await this.db
      .select()
      .from(videoPurchases)
      .where(and(
        eq(videoPurchases.userId, userId),
        eq(videoPurchases.movieId, movieId)
      ));
    return result.length > 0;
  }

  async createVideoPurchase(purchase: InsertVideoPurchase): Promise<VideoPurchase> {
    const result = await this.db.insert(videoPurchases).values(purchase).returning();
    return result[0];
  }

  async getUserPurchasedVideos(userId: string): Promise<Movie[]> {
    const result = await this.db
      .select({ movie: movies })
      .from(videoPurchases)
      .innerJoin(movies, eq(videoPurchases.movieId, movies.id))
      .where(eq(videoPurchases.userId, userId));
    return result.map(r => r.movie);
  }

  async getMoviesWithCreditPurchase(): Promise<Movie[]> {
    const result = await this.db
      .select()
      .from(movies)
      .where(eq(movies.allowCreditPurchase, 1));
    return result;
  }

  // Analytics methods
  async trackMovieView(view: InsertMovieView): Promise<MovieView> {
    const result = await this.db.insert(movieViews).values(view).returning();
    return result[0];
  }

  async getAnalytics() {
    const now = Math.floor(Date.now() / 1000);
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);
    const monthStart = Math.floor(startOfMonth.getTime() / 1000);

    const [
      totalUsersResult,
      totalSubscribersResult,
      activeSubscribersResult,
      newSubscribersResult,
      lostSubscribersResult,
      totalRevenueResult,
      monthRevenueResult,
      totalViewsResult,
      watchTimeResult,
    ] = await Promise.all([
      this.db.select({ count: sql<number>`count(*)::int` }).from(users),
      this.db.select({ count: sql<number>`count(DISTINCT user_id)::int` }).from(userSubscriptions),
      this.db.select({ count: sql<number>`count(*)::int` }).from(userSubscriptions)
        .where(and(eq(userSubscriptions.status, 'active'), sql`${userSubscriptions.endDate} > ${now}`)),
      this.db.select({ count: sql<number>`count(*)::int` }).from(userSubscriptions)
        .where(sql`${userSubscriptions.startDate} >= ${monthStart}`),
      this.db.select({ count: sql<number>`count(*)::int` }).from(userSubscriptions)
        .where(and(eq(userSubscriptions.status, 'cancelled'), sql`${userSubscriptions.endDate} >= ${monthStart}`)),
      this.db.select({ total: sql<number>`COALESCE(SUM(amount), 0)::float` }).from(paymentTransactions)
        .where(eq(paymentTransactions.status, 'completed')),
      this.db.select({ total: sql<number>`COALESCE(SUM(amount), 0)::float` }).from(paymentTransactions)
        .where(and(eq(paymentTransactions.status, 'completed'), sql`${paymentTransactions.completedAt} >= ${monthStart}`)),
      this.db.select({ count: sql<number>`count(*)::int` }).from(movieViews),
      this.db.select({ total: sql<number>`COALESCE(SUM(watch_duration), 0)::int` }).from(movieViews),
    ]);

    const totalViews = totalViewsResult[0].count;
    const totalWatchTime = watchTimeResult[0].total;

    return {
      totalUsers: totalUsersResult[0].count,
      totalSubscribers: totalSubscribersResult[0].count,
      activeSubscribers: activeSubscribersResult[0].count,
      newSubscribersThisMonth: newSubscribersResult[0].count,
      lostSubscribersThisMonth: lostSubscribersResult[0].count,
      totalRevenue: totalRevenueResult[0].total,
      revenueThisMonth: monthRevenueResult[0].total,
      totalMovieViews: totalViews,
      totalWatchTimeHours: Math.round(totalWatchTime / 3600 * 10) / 10,
      averageWatchTimeMinutes: totalViews > 0 ? Math.round(totalWatchTime / totalViews / 60 * 10) / 10 : 0,
    };
  }

  async getTopMovies(limit: number = 10) {
    const result = await this.db
      .select({
        movieId: movieViews.movieId,
        views: sql<number>`count(*)::int`,
        totalWatchTime: sql<number>`COALESCE(SUM(${movieViews.watchDuration}), 0)::int`,
      })
      .from(movieViews)
      .groupBy(movieViews.movieId)
      .orderBy(sql`count(*) DESC`)
      .limit(limit);

    const moviesWithStats = await Promise.all(
      result.map(async (item) => {
        const movie = await this.getMovieById(item.movieId);
        return movie ? { movie, views: item.views, totalWatchTime: item.totalWatchTime } : null;
      })
    );

    return moviesWithStats.filter((item): item is { movie: Movie; views: number; totalWatchTime: number } => item !== null);
  }

  async getTopGenres(limit: number = 10) {
    const result = await this.db
      .select({
        movieId: movieViews.movieId,
        views: sql<number>`count(*)::int`,
      })
      .from(movieViews)
      .groupBy(movieViews.movieId);

    const genreCount = new Map<string, number>();
    
    for (const item of result) {
      const movie = await this.getMovieById(item.movieId);
      if (movie) {
        for (const genre of movie.genres) {
          genreCount.set(genre, (genreCount.get(genre) || 0) + item.views);
        }
      }
    }

    return Array.from(genreCount.entries())
      .map(([genre, views]) => ({ genre, views }))
      .sort((a, b) => b.views - a.views)
      .slice(0, limit);
  }

  async getRevenueByMonth(months: number = 6) {
    const result = await this.db
      .select({
        month: sql<string>`TO_CHAR(TO_TIMESTAMP(${paymentTransactions.completedAt}), 'YYYY-MM')`,
        revenue: sql<number>`COALESCE(SUM(amount), 0)::float`,
        subscribers: sql<number>`count(DISTINCT ${paymentTransactions.userId})::int`,
      })
      .from(paymentTransactions)
      .where(eq(paymentTransactions.status, 'completed'))
      .groupBy(sql`TO_CHAR(TO_TIMESTAMP(${paymentTransactions.completedAt}), 'YYYY-MM')`)
      .orderBy(sql`TO_CHAR(TO_TIMESTAMP(${paymentTransactions.completedAt}), 'YYYY-MM') DESC`)
      .limit(months);

    return result;
  }

  async getPaymentIssues() {
    return await this.db
      .select()
      .from(paymentTransactions)
      .where(eq(paymentTransactions.status, 'failed'))
      .orderBy(sql`${paymentTransactions.createdAt} DESC`)
      .limit(50);
  }

  async getRecentActivity(limit: number = 20) {
    const [recentViews, recentPayments, recentUsers] = await Promise.all([
      this.db.select().from(movieViews).orderBy(sql`${movieViews.viewedAt} DESC`).limit(limit),
      this.db.select().from(paymentTransactions).orderBy(sql`${paymentTransactions.createdAt} DESC`).limit(limit),
      this.db.select().from(users).orderBy(sql`1 DESC`).limit(limit),
    ]);

    const activities: Array<{ type: string; data: any; timestamp: number }> = [
      ...recentViews.map(v => ({ type: 'view', data: v, timestamp: v.viewedAt })),
      ...recentPayments.map(p => ({ type: 'payment', data: p, timestamp: p.createdAt })),
    ];

    return activities.sort((a, b) => b.timestamp - a.timestamp).slice(0, limit);
  }

  // Ad Banner methods
  async getAllAdBanners(): Promise<AdBanner[]> {
    return await this.db.select().from(adBanners).orderBy(sql`${adBanners.createdAt} DESC`);
  }

  async getActiveAdBanners(): Promise<AdBanner[]> {
    return await this.db.select().from(adBanners).where(eq(adBanners.isActive, 1)).orderBy(sql`${adBanners.createdAt} DESC`);
  }

  async getAdBanner(id: string): Promise<AdBanner | undefined> {
    const result = await this.db.select().from(adBanners).where(eq(adBanners.id, id));
    return result[0];
  }

  async createAdBanner(banner: InsertAdBanner): Promise<AdBanner> {
    const result = await this.db.insert(adBanners).values(banner).returning();
    return result[0];
  }

  async updateAdBanner(id: string, banner: Partial<InsertAdBanner>): Promise<AdBanner | undefined> {
    const result = await this.db.update(adBanners).set(banner).where(eq(adBanners.id, id)).returning();
    return result[0];
  }

  async deleteAdBanner(id: string): Promise<boolean> {
    const result = await this.db.delete(adBanners).where(eq(adBanners.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Security methods
  async createSecurityViolation(violation: InsertSecurityViolation): Promise<SecurityViolation> {
    const result = await this.db.insert(securityViolations).values(violation).returning();
    return result[0];
  }

  async getUserViolationCount(userId: string, violationType: string, hoursBack: number): Promise<number> {
    const cutoff = Math.floor(Date.now() / 1000) - (hoursBack * 3600);
    const result = await this.db.select({ count: sql<number>`count(*)::int` })
      .from(securityViolations)
      .where(and(
        eq(securityViolations.userId, userId),
        eq(securityViolations.violationType, violationType),
        sql`${securityViolations.createdAt} > ${cutoff}`
      ));
    return result[0].count;
  }

  async getUserViolations(userId: string, limit: number): Promise<SecurityViolation[]> {
    return await this.db.select().from(securityViolations)
      .where(eq(securityViolations.userId, userId))
      .orderBy(sql`${securityViolations.createdAt} DESC`)
      .limit(limit);
  }

  async getAllViolations(limit: number): Promise<SecurityViolation[]> {
    return await this.db.select().from(securityViolations)
      .orderBy(sql`${securityViolations.createdAt} DESC`)
      .limit(limit);
  }

  // Ban methods
  async createUserBan(ban: InsertUserBan): Promise<UserBan> {
    const result = await this.db.insert(userBans).values(ban).returning();
    return result[0];
  }

  async getActiveUserBan(userId: string): Promise<UserBan | undefined> {
    const result = await this.db.select().from(userBans)
      .where(and(
        eq(userBans.userId, userId),
        eq(userBans.isActive, 1)
      ))
      .orderBy(sql`${userBans.bannedAt} DESC`)
      .limit(1);
    return result[0];
  }

  async deactivateUserBan(id: string): Promise<void> {
    await this.db.update(userBans).set({ isActive: 0 }).where(eq(userBans.id, id));
  }

  async deactivateAllUserBans(userId: string): Promise<void> {
    await this.db.update(userBans).set({ isActive: 0 }).where(eq(userBans.userId, userId));
  }

  async getAllBans(limit: number): Promise<UserBan[]> {
    return await this.db.select().from(userBans)
      .orderBy(sql`${userBans.bannedAt} DESC`)
      .limit(limit);
  }

  // Watch time methods
  async getDailyWatchTime(userId: string, date: string): Promise<DailyWatchTime | undefined> {
    const result = await this.db.select().from(dailyWatchTime)
      .where(and(
        eq(dailyWatchTime.userId, userId),
        eq(dailyWatchTime.date, date)
      ))
      .limit(1);
    return result[0];
  }

  async updateDailyWatchTime(userId: string, date: string, secondsWatched: number): Promise<void> {
    const existing = await this.getDailyWatchTime(userId, date);
    if (existing) {
      await this.db.update(dailyWatchTime)
        .set({ 
          totalSeconds: existing.totalSeconds + secondsWatched,
          lastUpdated: Math.floor(Date.now() / 1000)
        })
        .where(eq(dailyWatchTime.id, existing.id));
    } else {
      await this.db.insert(dailyWatchTime).values({
        userId,
        date,
        totalSeconds: secondsWatched,
        playAttempts: 0
      });
    }
  }

  async incrementPlayAttempts(userId: string, date: string): Promise<void> {
    const existing = await this.getDailyWatchTime(userId, date);
    if (existing) {
      await this.db.update(dailyWatchTime)
        .set({ 
          playAttempts: existing.playAttempts + 1,
          lastUpdated: Math.floor(Date.now() / 1000)
        })
        .where(eq(dailyWatchTime.id, existing.id));
    } else {
      await this.db.insert(dailyWatchTime).values({
        userId,
        date,
        totalSeconds: 0,
        playAttempts: 1
      });
    }
  }

  // Video token methods
  async createVideoAccessToken(data: { userId: string; movieId: string; token: string; ipAddress?: string; userAgent?: string; expiresAt: number }): Promise<void> {
    await this.db.insert(videoAccessTokens).values(data);
  }

  async getVideoAccessToken(token: string): Promise<{ userId: string; movieId: string; token: string; ipAddress?: string; expiresAt: number; used: number } | undefined> {
    const result = await this.db.select().from(videoAccessTokens)
      .where(eq(videoAccessTokens.token, token))
      .limit(1);
    if (result[0]) {
      return {
        userId: result[0].userId,
        movieId: result[0].movieId,
        token: result[0].token,
        ipAddress: result[0].ipAddress || undefined,
        expiresAt: result[0].expiresAt,
        used: result[0].used
      };
    }
    return undefined;
  }

  async markVideoTokenUsed(token: string): Promise<void> {
    await this.db.update(videoAccessTokens).set({ used: 1 }).where(eq(videoAccessTokens.token, token));
  }

  // Admin methods
  async getAdmin(id: string): Promise<Admin | undefined> {
    const result = await this.db.select().from(admins).where(eq(admins.id, id));
    return result[0];
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    const result = await this.db.select().from(admins).where(eq(admins.username, username));
    return result[0];
  }

  async getAllAdmins(): Promise<Admin[]> {
    return await this.db.select().from(admins);
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    const result = await this.db.insert(admins).values(admin).returning();
    return result[0];
  }

  async updateAdmin(id: string, admin: Partial<InsertAdmin> & { currentSessionId?: string | null }): Promise<Admin | undefined> {
    const result = await this.db.update(admins).set(admin).where(eq(admins.id, id)).returning();
    return result[0];
  }

  async deleteAdmin(id: string): Promise<boolean> {
    const result = await this.db.delete(admins).where(eq(admins.id, id)).returning();
    return result.length > 0;
  }

  // Pending Email Registration methods
  async getPendingEmailRegistration(email: string): Promise<PendingEmailRegistration | undefined> {
    const result = await this.db.select().from(pendingEmailRegistrations).where(eq(pendingEmailRegistrations.email, email.toLowerCase()));
    return result[0];
  }

  async createPendingEmailRegistration(data: { email: string; fullName: string; passwordHash: string; otpHash: string; otpExpiresAt: number }): Promise<PendingEmailRegistration> {
    const email = data.email.toLowerCase();
    // Delete any existing pending registration for this email
    await this.db.delete(pendingEmailRegistrations).where(eq(pendingEmailRegistrations.email, email));
    const result = await this.db.insert(pendingEmailRegistrations).values({
      email,
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      otpHash: data.otpHash,
      otpExpiresAt: data.otpExpiresAt,
    }).returning();
    return result[0];
  }

  async updatePendingEmailRegistration(email: string, data: Partial<{ otpHash: string; otpExpiresAt: number; attemptCount: number; resendCount: number }>): Promise<PendingEmailRegistration | undefined> {
    const result = await this.db.update(pendingEmailRegistrations).set(data).where(eq(pendingEmailRegistrations.email, email.toLowerCase())).returning();
    return result[0];
  }

  async deletePendingEmailRegistration(email: string): Promise<boolean> {
    const result = await this.db.delete(pendingEmailRegistrations).where(eq(pendingEmailRegistrations.email, email.toLowerCase()));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Pending Phone Registration methods
  async getPendingPhoneRegistration(phoneNumber: string): Promise<PendingPhoneRegistration | undefined> {
    const result = await this.db.select().from(pendingPhoneRegistrations).where(eq(pendingPhoneRegistrations.phoneNumber, phoneNumber));
    return result[0];
  }

  async createPendingPhoneRegistration(data: { phoneNumber: string; fullName: string; passwordHash: string; otpHash: string; otpExpiresAt: number }): Promise<PendingPhoneRegistration> {
    // Delete any existing pending registration for this phone
    await this.db.delete(pendingPhoneRegistrations).where(eq(pendingPhoneRegistrations.phoneNumber, data.phoneNumber));
    const result = await this.db.insert(pendingPhoneRegistrations).values({
      phoneNumber: data.phoneNumber,
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      otpHash: data.otpHash,
      otpExpiresAt: data.otpExpiresAt,
    }).returning();
    return result[0];
  }

  async updatePendingPhoneRegistration(phoneNumber: string, data: Partial<{ otpHash: string; otpExpiresAt: number; attemptCount: number; resendCount: number }>): Promise<PendingPhoneRegistration | undefined> {
    const result = await this.db.update(pendingPhoneRegistrations).set(data).where(eq(pendingPhoneRegistrations.phoneNumber, phoneNumber)).returning();
    return result[0];
  }

  async deletePendingPhoneRegistration(phoneNumber: string): Promise<boolean> {
    const result = await this.db.delete(pendingPhoneRegistrations).where(eq(pendingPhoneRegistrations.phoneNumber, phoneNumber));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Pending Password Reset methods
  async getPendingPasswordReset(userId: string): Promise<PendingPasswordReset | undefined> {
    const result = await this.db.select().from(pendingPasswordResets).where(eq(pendingPasswordResets.userId, userId));
    return result[0];
  }

  async createPendingPasswordReset(data: { userId: string; email?: string; phoneNumber?: string; otpHash: string; otpExpiresAt: number }): Promise<PendingPasswordReset> {
    await this.db.delete(pendingPasswordResets).where(eq(pendingPasswordResets.userId, data.userId));
    const result = await this.db.insert(pendingPasswordResets).values({
      userId: data.userId,
      email: data.email || null,
      phoneNumber: data.phoneNumber || null,
      otpHash: data.otpHash,
      otpExpiresAt: data.otpExpiresAt,
    }).returning();
    return result[0];
  }

  async updatePendingPasswordReset(userId: string, data: Partial<{ otpHash: string; otpExpiresAt: number; attemptCount: number; resendCount: number }>): Promise<PendingPasswordReset | undefined> {
    const result = await this.db.update(pendingPasswordResets).set(data).where(eq(pendingPasswordResets.userId, userId)).returning();
    return result[0];
  }

  async deletePendingPasswordReset(userId: string): Promise<boolean> {
    const result = await this.db.delete(pendingPasswordResets).where(eq(pendingPasswordResets.userId, userId));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Movie User Rating methods
  async getUserMovieRating(userId: string, movieId: string): Promise<MovieUserRating | undefined> {
    const result = await this.db.select().from(movieUserRatings)
      .where(and(eq(movieUserRatings.userId, userId), eq(movieUserRatings.movieId, movieId)));
    return result[0];
  }

  async submitUserMovieRating(userId: string, movieId: string, score: number): Promise<MovieUserRating> {
    const existing = await this.getUserMovieRating(userId, movieId);
    const now = Math.floor(Date.now() / 1000);
    
    let rating: MovieUserRating;
    if (existing) {
      const result = await this.db.update(movieUserRatings)
        .set({ score: score.toString(), updatedAt: now })
        .where(and(eq(movieUserRatings.userId, userId), eq(movieUserRatings.movieId, movieId)))
        .returning();
      rating = result[0];
    } else {
      const result = await this.db.insert(movieUserRatings)
        .values({ userId, movieId, score: score.toString() })
        .returning();
      rating = result[0];
    }

    // Update movie's aggregate rating
    const stats = await this.getMovieRatingStats(movieId);
    await this.db.update(movies).set({
      userRatingAvg: stats.average.toFixed(1),
      userRatingCount: stats.count,
    }).where(eq(movies.id, movieId));

    return rating;
  }

  async getMovieRatingStats(movieId: string): Promise<{ average: number; count: number }> {
    const result = await this.db.select({
      average: sql<number>`COALESCE(AVG(${movieUserRatings.score}::numeric), 0)`,
      count: sql<number>`COUNT(*)::integer`,
    }).from(movieUserRatings).where(eq(movieUserRatings.movieId, movieId));
    
    return {
      average: Number(result[0]?.average || 0),
      count: Number(result[0]?.count || 0),
    };
  }

  // Credit Transaction methods
  async createCreditTransaction(data: InsertCreditTransaction): Promise<CreditTransaction> {
    const result = await this.db.insert(creditTransactions).values(data).returning();
    return result[0];
  }

  async getUserCreditTransactions(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
    return await this.db.select()
      .from(creditTransactions)
      .where(eq(creditTransactions.userId, userId))
      .orderBy(sql`${creditTransactions.createdAt} DESC`)
      .limit(limit);
  }

  async addUserCredits(userId: string, amount: number, type: string, description: string, adminId?: string): Promise<{ user: User; transaction: CreditTransaction }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const currentBalance = parseFloat(user.balance);
    const newBalance = currentBalance + amount;
    
    const updatedUser = await this.updateUserBalance(userId, newBalance.toFixed(2));
    if (!updatedUser) throw new Error("Failed to update user balance");
    
    const transaction = await this.createCreditTransaction({
      userId,
      type,
      amount: amount.toFixed(2),
      balanceAfter: newBalance.toFixed(2),
      description,
      adminId: adminId || null,
      movieId: null,
    });
    
    return { user: updatedUser, transaction };
  }

  async deductUserCredits(userId: string, amount: number, description: string, movieId?: string): Promise<{ user: User; transaction: CreditTransaction }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const currentBalance = parseFloat(user.balance);
    if (currentBalance < amount) throw new Error("Insufficient balance");
    
    const newBalance = currentBalance - amount;
    
    const updatedUser = await this.updateUserBalance(userId, newBalance.toFixed(2));
    if (!updatedUser) throw new Error("Failed to update user balance");
    
    const transaction = await this.createCreditTransaction({
      userId,
      type: 'purchase',
      amount: (-amount).toFixed(2),
      balanceAfter: newBalance.toFixed(2),
      description,
      movieId: movieId || null,
      adminId: null,
    });
    
    return { user: updatedUser, transaction };
  }

  async getAllCreditTransactions(limit: number = 100): Promise<CreditTransaction[]> {
    return await this.db.select()
      .from(creditTransactions)
      .orderBy(sql`${creditTransactions.createdAt} DESC`)
      .limit(limit);
  }

  async getAppSetting(key: string): Promise<string | undefined> {
    const result = await this.db.execute(sql`
      SELECT value FROM app_settings WHERE key = ${key}
    `);
    return result.rows[0]?.value as string | undefined;
  }

  async setAppSetting(key: string, value: string, description?: string, adminId?: string): Promise<void> {
    await this.db.execute(sql`
      INSERT INTO app_settings (key, value, description, updated_by, updated_at)
      VALUES (${key}, ${value}, ${description || null}, ${adminId || null}, extract(epoch from now()))
      ON CONFLICT (key) DO UPDATE SET 
        value = ${value},
        description = COALESCE(${description || null}, app_settings.description),
        updated_by = ${adminId || null},
        updated_at = extract(epoch from now())
    `);
  }

  async getAllAppSettings(): Promise<Array<{ key: string; value: string; description: string | null; updatedAt: number }>> {
    const result = await this.db.execute(sql`
      SELECT key, value, description, updated_at as "updatedAt" FROM app_settings ORDER BY key
    `);
    return result.rows as Array<{ key: string; value: string; description: string | null; updatedAt: number }>;
  }
}

export class MemStorage implements IStorage {
  private users: Map<string, User>;
  private movies: Map<string, Movie>;
  private myListEntries: Map<string, { userId: string, movieId: string, addedAt: number }>;
  private creditTransactions: Map<string, CreditTransaction>;
  private appSettings: Map<string, { key: string; value: string; description: string | null; updatedAt: number }>;

  constructor() {
    this.users = new Map();
    this.movies = new Map();
    this.myListEntries = new Map();
    this.creditTransactions = new Map();
    this.appSettings = new Map();
    // Set default welcome credit amount
    this.appSettings.set('welcome_credit_amount', { 
      key: 'welcome_credit_amount', 
      value: '5.00', 
      description: 'Amount of credits given to new users on registration', 
      updatedAt: Math.floor(Date.now() / 1000) 
    });
  }

  async getUser(id: string): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByPhoneNumber(phoneNumber: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.phoneNumber === phoneNumber,
    );
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email,
    );
  }

  async getAllUsers(): Promise<User[]> {
    return Array.from(this.users.values());
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = randomUUID();
    const user: User = { 
      ...insertUser, 
      id, 
      phoneNumber: insertUser.phoneNumber || null,
      email: insertUser.email || null,
      avatarUrl: null,
      isAdmin: 0, 
      adminRole: null, 
      currentSessionId: null, 
      balance: "0.00", // Welcome bonus added via credit transaction after user creation 
      trustedUser: 0, 
      noWatermark: 0 
    };
    this.users.set(id, user);
    return user;
  }

  async updateUser(id: string, updateData: UserUpdateData): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      ...updateData,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserBalance(id: string, balance: string): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      balance,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserTrustedStatus(id: string, trusted: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      trustedUser: trusted,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async updateUserNoWatermarkStatus(id: string, noWatermark: number): Promise<User | undefined> {
    const user = this.users.get(id);
    if (!user) return undefined;
    
    const updatedUser: User = {
      ...user,
      noWatermark: noWatermark,
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: string): Promise<boolean> {
    return this.users.delete(id);
  }

  async getAllMovies(page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const allMovies = Array.from(this.movies.values())
      .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0)); // Sort newest first
    const offset = (page - 1) * limit;
    const movies = allMovies.slice(offset, offset + limit);
    return { movies, total: allMovies.length };
  }

  async getMovieById(id: string): Promise<Movie | undefined> {
    return this.movies.get(id);
  }

  async getMoviesByGenre(genre: string, page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const filtered = Array.from(this.movies.values()).filter(
      (movie) => movie.genres.includes(genre)
    );
    const offset = (page - 1) * limit;
    const movies = filtered.slice(offset, offset + limit);
    return { movies, total: filtered.length };
  }

  async getTrendingMovies(page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const filtered = Array.from(this.movies.values()).filter(m => m.isTrending === 1);
    const offset = (page - 1) * limit;
    const movies = filtered.slice(offset, offset + limit);
    return { movies, total: filtered.length };
  }

  async getNewAndPopularMovies(page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const filtered = Array.from(this.movies.values()).filter(m => m.isNewAndPopular === 1);
    const offset = (page - 1) * limit;
    const movies = filtered.slice(offset, offset + limit);
    return { movies, total: filtered.length };
  }

  async getHeroBannerMovie(): Promise<Movie | undefined> {
    return Array.from(this.movies.values()).find(m => m.isHeroBanner === 1);
  }

  async searchMovies(query: string, page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const lowerQuery = query.toLowerCase();
    const filtered = Array.from(this.movies.values()).filter(
      (movie) => 
        movie.title.toLowerCase().includes(lowerQuery) ||
        movie.description.toLowerCase().includes(lowerQuery) ||
        movie.genres.some(genre => genre.toLowerCase().includes(lowerQuery)) ||
        movie.cast.some(actor => actor.toLowerCase().includes(lowerQuery))
    );
    const offset = (page - 1) * limit;
    const movies = filtered.slice(offset, offset + limit);
    return { movies, total: filtered.length };
  }

  async createMovie(insertMovie: InsertMovie): Promise<Movie> {
    const id = randomUUID();
    const movie: Movie = { 
      ...insertMovie, 
      id,
      rating: insertMovie.rating.toString(),
      imdbRating: insertMovie.imdbRating || null,
      tmdbRating: insertMovie.tmdbRating || null,
      country: insertMovie.country || "USA",
      videoEmbedUrl: insertMovie.videoEmbedUrl || null,
      trailerUrl: insertMovie.trailerUrl || null,
      isFree: insertMovie.isFree || 0,
      price: insertMovie.price || "1.00",
      isTrending: insertMovie.isTrending || 0,
      isNewAndPopular: insertMovie.isNewAndPopular || 0,
      isHeroBanner: insertMovie.isHeroBanner || 0,
      userRatingAvg: "0",
      userRatingCount: 0,
      createdAt: Math.floor(Date.now() / 1000) // Unix timestamp
    };
    this.movies.set(id, movie);
    return movie;
  }

  async updateMovie(id: string, updateData: Partial<InsertMovie>): Promise<Movie | undefined> {
    const movie = this.movies.get(id);
    if (!movie) return undefined;
    
    const updatedMovie: Movie = {
      ...movie,
      ...updateData,
      rating: updateData.rating ? updateData.rating.toString() : movie.rating,
    };
    this.movies.set(id, updatedMovie);
    return updatedMovie;
  }

  async deleteMovie(id: string): Promise<boolean> {
    return this.movies.delete(id);
  }

  // My List methods
  async getUserMyList(userId: string, page: number = 1, limit: number = 20): Promise<{ movies: Movie[], total: number }> {
    const entries = Array.from(this.myListEntries.values())
      .filter(entry => entry.userId === userId);
    const movieIds = entries.map(entry => entry.movieId);
    const userMovies = movieIds
      .map(id => this.movies.get(id))
      .filter((m): m is Movie => m !== undefined);
    
    const offset = (page - 1) * limit;
    const movies = userMovies.slice(offset, offset + limit);
    return { movies, total: userMovies.length };
  }

  async addToMyList(userId: string, movieId: string): Promise<MyList> {
    const id = randomUUID();
    const entry: MyList = {
      id,
      userId,
      movieId,
      addedAt: Math.floor(Date.now() / 1000)
    };
    this.myListEntries.set(id, entry);
    return entry;
  }

  async removeFromMyList(userId: string, movieId: string): Promise<boolean> {
    const entry = Array.from(this.myListEntries.entries())
      .find(([_, e]) => e.userId === userId && e.movieId === movieId);
    if (entry) {
      return this.myListEntries.delete(entry[0]);
    }
    return false;
  }

  async isInMyList(userId: string, movieId: string): Promise<boolean> {
    return Array.from(this.myListEntries.values())
      .some(entry => entry.userId === userId && entry.movieId === movieId);
  }

  // Subscription methods (stub for in-memory)
  async getSubscriptionPlans(): Promise<SubscriptionPlan[]> {
    return [];
  }

  async getMonthlyPlan(): Promise<SubscriptionPlan | undefined> {
    return undefined;
  }

  async getUserSubscription(userId: string): Promise<UserSubscription | undefined> {
    return undefined;
  }

  async createUserSubscription(subscription: InsertUserSubscription): Promise<UserSubscription> {
    throw new Error("Subscriptions require database storage");
  }

  async updateUserSubscription(id: string, data: Partial<InsertUserSubscription>): Promise<UserSubscription | undefined> {
    throw new Error("Subscriptions require database storage");
  }

  async isUserSubscribed(userId: string): Promise<boolean> {
    return false;
  }

  // Payment methods (stub for in-memory)
  async createPaymentTransaction(payment: InsertPaymentTransaction): Promise<PaymentTransaction> {
    throw new Error("Payments require database storage");
  }

  async updatePaymentTransaction(id: string, data: Partial<InsertPaymentTransaction>): Promise<PaymentTransaction | undefined> {
    throw new Error("Payments require database storage");
  }

  async getPaymentTransaction(id: string): Promise<PaymentTransaction | undefined> {
    return undefined;
  }

  async getPaymentTransactionByRef(transactionRef: string): Promise<PaymentTransaction | undefined> {
    return undefined;
  }

  // Video Purchase methods (stub for in-memory)
  async hasUserPurchasedVideo(userId: string, movieId: string): Promise<boolean> {
    return false;
  }

  async createVideoPurchase(purchase: InsertVideoPurchase): Promise<VideoPurchase> {
    throw new Error("Video purchases require database storage");
  }

  async getUserPurchasedVideos(userId: string): Promise<Movie[]> {
    return [];
  }

  async getMoviesWithCreditPurchase(): Promise<Movie[]> {
    return Array.from(this.movies.values()).filter(m => m.allowCreditPurchase === 1);
  }

  // Analytics methods (stub for in-memory)
  async trackMovieView(view: InsertMovieView): Promise<MovieView> {
    throw new Error("Analytics require database storage");
  }

  async getAnalytics() {
    return {
      totalUsers: this.users.size,
      totalSubscribers: 0,
      activeSubscribers: 0,
      newSubscribersThisMonth: 0,
      lostSubscribersThisMonth: 0,
      totalRevenue: 0,
      revenueThisMonth: 0,
      totalMovieViews: 0,
      totalWatchTimeHours: 0,
      averageWatchTimeMinutes: 0,
    };
  }

  async getTopMovies(limit: number = 10) {
    return [];
  }

  async getTopGenres(limit: number = 10) {
    return [];
  }

  async getRevenueByMonth(months: number = 6) {
    return [];
  }

  async getPaymentIssues() {
    return [];
  }

  async getRecentActivity(limit: number = 20) {
    return [];
  }

  // Ad Banner methods (stub for in-memory)
  async getAllAdBanners(): Promise<AdBanner[]> {
    return [];
  }

  async getActiveAdBanners(): Promise<AdBanner[]> {
    return [];
  }

  async getAdBanner(id: string): Promise<AdBanner | undefined> {
    return undefined;
  }

  async createAdBanner(banner: InsertAdBanner): Promise<AdBanner> {
    throw new Error("Ad banners require database storage");
  }

  async updateAdBanner(id: string, banner: Partial<InsertAdBanner>): Promise<AdBanner | undefined> {
    throw new Error("Ad banners require database storage");
  }

  async deleteAdBanner(id: string): Promise<boolean> {
    throw new Error("Ad banners require database storage");
  }

  // Security methods (stubs - require database)
  async createSecurityViolation(violation: InsertSecurityViolation): Promise<SecurityViolation> {
    throw new Error("Security features require database storage");
  }

  async getUserViolationCount(userId: string, violationType: string, hoursBack: number): Promise<number> {
    return 0;
  }

  async getUserViolations(userId: string, limit: number): Promise<SecurityViolation[]> {
    return [];
  }

  async getAllViolations(limit: number): Promise<SecurityViolation[]> {
    return [];
  }

  async createUserBan(ban: InsertUserBan): Promise<UserBan> {
    throw new Error("Security features require database storage");
  }

  async getActiveUserBan(userId: string): Promise<UserBan | undefined> {
    return undefined;
  }

  async deactivateUserBan(id: string): Promise<void> {}

  async deactivateAllUserBans(userId: string): Promise<void> {}

  async getAllBans(limit: number): Promise<UserBan[]> {
    return [];
  }

  async getDailyWatchTime(userId: string, date: string): Promise<DailyWatchTime | undefined> {
    return undefined;
  }

  async updateDailyWatchTime(userId: string, date: string, secondsWatched: number): Promise<void> {}

  async incrementPlayAttempts(userId: string, date: string): Promise<void> {}

  async createVideoAccessToken(data: { userId: string; movieId: string; token: string; ipAddress?: string; userAgent?: string; expiresAt: number }): Promise<void> {}

  async getVideoAccessToken(token: string): Promise<{ userId: string; movieId: string; token: string; ipAddress?: string; expiresAt: number; used: number } | undefined> {
    return undefined;
  }

  async markVideoTokenUsed(token: string): Promise<void> {}

  // Admin methods (memory storage not supported for admins - database required)
  async getAdmin(id: string): Promise<Admin | undefined> {
    return undefined;
  }

  async getAdminByUsername(username: string): Promise<Admin | undefined> {
    return undefined;
  }

  async getAllAdmins(): Promise<Admin[]> {
    return [];
  }

  async createAdmin(admin: InsertAdmin): Promise<Admin> {
    throw new Error("Admin features require database storage");
  }

  async updateAdmin(id: string, admin: Partial<InsertAdmin> & { currentSessionId?: string | null }): Promise<Admin | undefined> {
    return undefined;
  }

  async deleteAdmin(id: string): Promise<boolean> {
    return false;
  }

  // Pending Email Registration methods (memory-based for dev)
  private pendingEmailRegistrations: Map<string, PendingEmailRegistration> = new Map();

  async getPendingEmailRegistration(email: string): Promise<PendingEmailRegistration | undefined> {
    return this.pendingEmailRegistrations.get(email.toLowerCase());
  }

  async createPendingEmailRegistration(data: { email: string; fullName: string; passwordHash: string; otpHash: string; otpExpiresAt: number }): Promise<PendingEmailRegistration> {
    const email = data.email.toLowerCase();
    const pending: PendingEmailRegistration = {
      id: randomUUID(),
      email,
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      otpHash: data.otpHash,
      otpExpiresAt: data.otpExpiresAt,
      attemptCount: 0,
      resendCount: 0,
      createdAt: Math.floor(Date.now() / 1000),
    };
    this.pendingEmailRegistrations.set(email, pending);
    return pending;
  }

  async updatePendingEmailRegistration(email: string, data: Partial<{ otpHash: string; otpExpiresAt: number; attemptCount: number; resendCount: number }>): Promise<PendingEmailRegistration | undefined> {
    const existing = this.pendingEmailRegistrations.get(email.toLowerCase());
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.pendingEmailRegistrations.set(email.toLowerCase(), updated);
    return updated;
  }

  async deletePendingEmailRegistration(email: string): Promise<boolean> {
    return this.pendingEmailRegistrations.delete(email.toLowerCase());
  }

  // Pending Phone Registration methods (MemStorage stubs)
  private pendingPhoneRegistrations: Map<string, PendingPhoneRegistration> = new Map();

  async getPendingPhoneRegistration(phoneNumber: string): Promise<PendingPhoneRegistration | undefined> {
    return this.pendingPhoneRegistrations.get(phoneNumber);
  }

  async createPendingPhoneRegistration(data: { phoneNumber: string; fullName: string; passwordHash: string; otpHash: string; otpExpiresAt: number }): Promise<PendingPhoneRegistration> {
    const pending: PendingPhoneRegistration = {
      id: randomUUID(),
      phoneNumber: data.phoneNumber,
      fullName: data.fullName,
      passwordHash: data.passwordHash,
      otpHash: data.otpHash,
      otpExpiresAt: data.otpExpiresAt,
      attemptCount: 0,
      resendCount: 0,
      createdAt: Math.floor(Date.now() / 1000),
    };
    this.pendingPhoneRegistrations.set(data.phoneNumber, pending);
    return pending;
  }

  async updatePendingPhoneRegistration(phoneNumber: string, data: Partial<{ otpHash: string; otpExpiresAt: number; attemptCount: number; resendCount: number }>): Promise<PendingPhoneRegistration | undefined> {
    const existing = this.pendingPhoneRegistrations.get(phoneNumber);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.pendingPhoneRegistrations.set(phoneNumber, updated);
    return updated;
  }

  async deletePendingPhoneRegistration(phoneNumber: string): Promise<boolean> {
    return this.pendingPhoneRegistrations.delete(phoneNumber);
  }

  // Pending Password Reset methods (MemStorage stubs)
  private pendingPasswordResets: Map<string, PendingPasswordReset> = new Map();

  async getPendingPasswordReset(userId: string): Promise<PendingPasswordReset | undefined> {
    return this.pendingPasswordResets.get(userId);
  }

  async createPendingPasswordReset(data: { userId: string; email?: string; phoneNumber?: string; otpHash: string; otpExpiresAt: number }): Promise<PendingPasswordReset> {
    const pending: PendingPasswordReset = {
      id: randomUUID(),
      userId: data.userId,
      email: data.email || null,
      phoneNumber: data.phoneNumber || null,
      otpHash: data.otpHash,
      otpExpiresAt: data.otpExpiresAt,
      attemptCount: 0,
      resendCount: 0,
      createdAt: Math.floor(Date.now() / 1000),
    };
    this.pendingPasswordResets.set(data.userId, pending);
    return pending;
  }

  async updatePendingPasswordReset(userId: string, data: Partial<{ otpHash: string; otpExpiresAt: number; attemptCount: number; resendCount: number }>): Promise<PendingPasswordReset | undefined> {
    const existing = this.pendingPasswordResets.get(userId);
    if (!existing) return undefined;
    const updated = { ...existing, ...data };
    this.pendingPasswordResets.set(userId, updated);
    return updated;
  }

  async deletePendingPasswordReset(userId: string): Promise<boolean> {
    return this.pendingPasswordResets.delete(userId);
  }

  // Movie User Rating methods (MemStorage implementation)
  private movieUserRatings: Map<string, MovieUserRating> = new Map();

  async getUserMovieRating(userId: string, movieId: string): Promise<MovieUserRating | undefined> {
    const key = `${userId}:${movieId}`;
    return this.movieUserRatings.get(key);
  }

  async submitUserMovieRating(userId: string, movieId: string, score: number): Promise<MovieUserRating> {
    const key = `${userId}:${movieId}`;
    const now = Math.floor(Date.now() / 1000);
    const existing = this.movieUserRatings.get(key);
    
    const rating: MovieUserRating = {
      id: existing?.id || randomUUID(),
      userId,
      movieId,
      score: score.toString(),
      createdAt: existing?.createdAt || now,
      updatedAt: now,
    };
    this.movieUserRatings.set(key, rating);
    return rating;
  }

  async getMovieRatingStats(movieId: string): Promise<{ average: number; count: number }> {
    const ratings = Array.from(this.movieUserRatings.values()).filter(r => r.movieId === movieId);
    if (ratings.length === 0) return { average: 0, count: 0 };
    const total = ratings.reduce((sum, r) => sum + Number(r.score), 0);
    return { average: total / ratings.length, count: ratings.length };
  }

  // Credit Transaction methods (MemStorage implementation)
  async createCreditTransaction(data: InsertCreditTransaction): Promise<CreditTransaction> {
    const id = randomUUID();
    const transaction: CreditTransaction = {
      id,
      userId: data.userId,
      type: data.type,
      amount: data.amount,
      balanceAfter: data.balanceAfter,
      description: data.description || null,
      movieId: data.movieId || null,
      adminId: data.adminId || null,
      createdAt: Math.floor(Date.now() / 1000),
    };
    this.creditTransactions.set(id, transaction);
    return transaction;
  }

  async getUserCreditTransactions(userId: string, limit: number = 50): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .filter(t => t.userId === userId)
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  async addUserCredits(userId: string, amount: number, type: string, description: string, adminId?: string): Promise<{ user: User; transaction: CreditTransaction }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const currentBalance = parseFloat(user.balance);
    const newBalance = currentBalance + amount;
    
    const updatedUser = await this.updateUserBalance(userId, newBalance.toFixed(2));
    if (!updatedUser) throw new Error("Failed to update user balance");
    
    const transaction = await this.createCreditTransaction({
      userId,
      type,
      amount: amount.toFixed(2),
      balanceAfter: newBalance.toFixed(2),
      description,
      adminId: adminId || null,
      movieId: null,
    });
    
    return { user: updatedUser, transaction };
  }

  async deductUserCredits(userId: string, amount: number, description: string, movieId?: string): Promise<{ user: User; transaction: CreditTransaction }> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");
    
    const currentBalance = parseFloat(user.balance);
    if (currentBalance < amount) throw new Error("Insufficient balance");
    
    const newBalance = currentBalance - amount;
    
    const updatedUser = await this.updateUserBalance(userId, newBalance.toFixed(2));
    if (!updatedUser) throw new Error("Failed to update user balance");
    
    const transaction = await this.createCreditTransaction({
      userId,
      type: 'purchase',
      amount: (-amount).toFixed(2),
      balanceAfter: newBalance.toFixed(2),
      description,
      movieId: movieId || null,
      adminId: null,
    });
    
    return { user: updatedUser, transaction };
  }

  async getAllCreditTransactions(limit: number = 100): Promise<CreditTransaction[]> {
    return Array.from(this.creditTransactions.values())
      .sort((a, b) => b.createdAt - a.createdAt)
      .slice(0, limit);
  }

  async getAppSetting(key: string): Promise<string | undefined> {
    return this.appSettings.get(key)?.value;
  }

  async setAppSetting(key: string, value: string, description?: string, adminId?: string): Promise<void> {
    this.appSettings.set(key, { 
      key, 
      value, 
      description: description || null, 
      updatedAt: Math.floor(Date.now() / 1000) 
    });
  }

  async getAllAppSettings(): Promise<Array<{ key: string; value: string; description: string | null; updatedAt: number }>> {
    return Array.from(this.appSettings.values()).sort((a, b) => a.key.localeCompare(b.key));
  }
}

// Use database storage if DATABASE_URL is available, otherwise use in-memory
export const storage: IStorage = process.env.DATABASE_URL 
  ? new DatabaseStorage(process.env.DATABASE_URL)
  : new MemStorage();
