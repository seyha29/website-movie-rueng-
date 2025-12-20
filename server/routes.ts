import type { Express, Request, Response, NextFunction } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertMovieSchema, insertUserSchema, insertAdBannerSchema } from "@shared/schema";
import { z } from "zod";
import bcrypt from "bcrypt";
import { createPaymentProvider } from "./payment-provider";
import { PaymentService } from "./payment-service";

// Initialize payment service
const paymentProvider = createPaymentProvider();
const paymentService = new PaymentService(paymentProvider);

// Middleware to check if user is authenticated (single-device login enforcement)
async function requireAuth(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    console.log("Auth failed - no session userId");
    return res.status(401).json({ error: "Unauthorized - Please login" });
  }
  
  // Single-device login: Check if this session is still the active session for this user
  const user = await storage.getUser(req.session.userId);
  if (!user) {
    console.log("Auth failed - user not found");
    return res.status(401).json({ error: "Unauthorized - User not found" });
  }
  
  // If user has a currentSessionId set and it doesn't match this session, they've logged in elsewhere
  if (user.currentSessionId && user.currentSessionId !== req.sessionID) {
    console.log("Auth failed - session invalidated (logged in on another device)", {
      userId: user.id,
      currentSessionId: user.currentSessionId,
      requestSessionId: req.sessionID
    });
    // Destroy this session since it's no longer valid
    req.session.destroy((err) => {
      if (err) console.error("Error destroying invalidated session:", err);
    });
    return res.status(401).json({ error: "Session expired - You have been logged out because you logged in on another device" });
  }
  
  console.log("Auth check passed for userId:", req.session.userId);
  next();
}

// Middleware to check if user is admin (with single-device login enforcement)
async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.session.userId) {
    return res.status(401).json({ error: "Unauthorized - Please login" });
  }

  const user = await storage.getUser(req.session.userId);
  if (!user) {
    return res.status(401).json({ error: "Unauthorized - User not found" });
  }

  // Single-device login check
  if (user.currentSessionId && user.currentSessionId !== req.sessionID) {
    req.session.destroy((err) => {
      if (err) console.error("Error destroying invalidated session:", err);
    });
    return res.status(401).json({ error: "Session expired - You have been logged out because you logged in on another device" });
  }

  if (user.isAdmin !== 1) {
    return res.status(403).json({ error: "Forbidden - Admin access required" });
  }

  next();
}

function requireAdminRole(...allowedRoles: string[]) {
  return async (req: Request, res: Response, next: NextFunction) => {
    if (!req.session.userId) {
      return res.status(401).json({ error: "Unauthorized - Please login" });
    }

    const user = await storage.getUser(req.session.userId);
    if (!user) {
      return res.status(401).json({ error: "Unauthorized - User not found" });
    }

    // Single-device login check
    if (user.currentSessionId && user.currentSessionId !== req.sessionID) {
      req.session.destroy((err) => {
        if (err) console.error("Error destroying invalidated session:", err);
      });
      return res.status(401).json({ error: "Session expired - You have been logged out because you logged in on another device" });
    }

    if (user.isAdmin !== 1) {
      return res.status(403).json({ error: "Forbidden - Admin access required" });
    }

    // Treat null/undefined adminRole as "full" for backward compatibility
    const userRole = user.adminRole || "full";
    
    // Check if user has the required role
    if (!allowedRoles.includes(userRole)) {
      return res.status(403).json({ error: "Forbidden - Insufficient permissions" });
    }

    next();
  };
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Auth routes
  app.post("/api/auth/register", async (req, res) => {
    try {
      // Phone number normalization is handled by schema validation
      const validatedData = insertUserSchema.parse(req.body);
      
      // Check if user already exists
      const existingUser = await storage.getUserByPhoneNumber(validatedData.phoneNumber);
      if (existingUser) {
        return res.status(400).json({ error: "User with this phone number already exists" });
      }

      // Check if this is the first user - grant admin privileges
      const allUsers = await storage.getAllUsers();
      const isFirstUser = allUsers.length === 0;

      // Hash password before storing
      const hashedPassword = await bcrypt.hash(validatedData.password, 10);
      const userDataWithHashedPassword = {
        ...validatedData,
        password: hashedPassword,
        isAdmin: isFirstUser ? 1 : 0
      };

      const user = await storage.createUser(userDataWithHashedPassword);
      req.session.userId = user.id;
      
      if (isFirstUser) {
        console.log('First user registered - granted admin privileges:', validatedData.phoneNumber);
      }
      
      // Explicitly save session before responding
      req.session.save(async (err) => {
        if (err) {
          return res.status(500).json({ error: "Failed to save session" });
        }
        
        // Single-device login: Save the current session ID to user record
        await storage.updateUser(user.id, { currentSessionId: req.sessionID });
        console.log("Session saved for new user:", user.id, "sessionID:", req.sessionID);
        
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        res.status(201).json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Registration error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid user data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to register user", message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  app.post("/api/auth/login", async (req, res) => {
    try {
      let { phoneNumber, password } = req.body;
      
      if (!phoneNumber || !password) {
        return res.status(400).json({ error: "Phone number and password are required" });
      }

      // Normalize phone number to +855xxxxxxxx format
      const digitsOnly = phoneNumber.replace(/^(\+855|855|0)/, '');
      phoneNumber = `+855${digitsOnly}`;

      const user = await storage.getUserByPhoneNumber(phoneNumber);
      if (!user) {
        return res.status(401).json({ error: "Invalid phone number or password" });
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Invalid phone number or password" });
      }

      req.session.userId = user.id;
      
      // Explicitly save session before responding
      req.session.save(async (err) => {
        if (err) {
          console.error("Session save error:", err);
          return res.status(500).json({ error: "Failed to save session" });
        }
        
        // Single-device login: Save the current session ID to user record
        // This invalidates any previous sessions for this user
        await storage.updateUser(user.id, { currentSessionId: req.sessionID });
        console.log("Session saved successfully for user:", user.id, "sessionID:", req.sessionID);
        
        // Don't send password in response
        const { password, ...userWithoutPassword } = user;
        res.json(userWithoutPassword);
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ error: "Failed to login" });
    }
  });

  app.post("/api/auth/logout", async (req, res) => {
    const userId = req.session.userId;
    
    // Clear the currentSessionId for this user if they're logging out from the active session
    if (userId) {
      try {
        const user = await storage.getUser(userId);
        if (user && user.currentSessionId === req.sessionID) {
          await storage.updateUser(userId, { currentSessionId: null });
          console.log("Cleared currentSessionId for user:", userId);
        }
      } catch (error) {
        console.error("Error clearing currentSessionId:", error);
      }
    }
    
    req.session.destroy((err) => {
      if (err) {
        return res.status(500).json({ error: "Failed to logout" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/me", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      // Don't send password in response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch user" });
    }
  });

  app.put("/api/auth/profile", requireAuth, async (req, res) => {
    try {
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }

      // Define and validate allowed profile update schema
      const profileUpdateSchema = z.object({
        fullName: z.string().optional(),
        phoneNumber: z.string().regex(/^\+855\d{8,9}$/, "Phone number must be in format +855xxxxxxxx").optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6, "New password must be at least 6 characters").optional(),
      });

      // Validate request body and reject any extra fields
      let validatedData;
      try {
        validatedData = profileUpdateSchema.parse(req.body);
      } catch (error) {
        if (error instanceof z.ZodError) {
          return res.status(400).json({ error: "Invalid profile data", details: error.errors });
        }
        throw error;
      }

      // Build update data with ONLY whitelisted fields
      const updateData: { fullName?: string; phoneNumber?: string; password?: string } = {};

      // Update full name if provided
      if (validatedData.fullName !== undefined) {
        updateData.fullName = validatedData.fullName;
      }

      // Update phone number if provided
      if (validatedData.phoneNumber !== undefined) {
        updateData.phoneNumber = validatedData.phoneNumber;
      }

      // Handle password change if requested
      if (validatedData.currentPassword && validatedData.newPassword) {
        // Verify current password
        const isPasswordValid = await bcrypt.compare(validatedData.currentPassword, user.password);
        if (!isPasswordValid) {
          return res.status(401).json({ error: "Current password is incorrect" });
        }

        // Hash new password
        const hashedPassword = await bcrypt.hash(validatedData.newPassword, 10);
        updateData.password = hashedPassword;
      }

      // Ensure no sensitive fields can be modified
      // Only fullName, phoneNumber, and password are allowed
      const updatedUser = await storage.updateUser(req.session.userId!, updateData);
      if (!updatedUser) {
        return res.status(500).json({ error: "Failed to update profile" });
      }

      // Don't send password in response
      const { password, ...userWithoutPassword } = updatedUser;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Profile update error:", error);
      res.status(500).json({ error: "Failed to update profile" });
    }
  });

  // My List routes (requires authentication)
  app.get("/api/my-list", requireAuth, async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.getUserMyList(req.session.userId!, page, limit);
      res.json(result);
    } catch (error) {
      console.error("Failed to fetch my list:", error);
      res.status(500).json({ error: "Failed to fetch your list" });
    }
  });

  app.post("/api/my-list/:movieId", requireAuth, async (req, res) => {
    try {
      const { movieId } = req.params;
      const userId = req.session.userId!;
      
      // Check if already in list
      const isInList = await storage.isInMyList(userId, movieId);
      if (isInList) {
        return res.status(400).json({ error: "Movie already in your list" });
      }
      
      const entry = await storage.addToMyList(userId, movieId);
      res.status(201).json(entry);
    } catch (error) {
      console.error("Failed to add to my list:", error);
      res.status(500).json({ error: "Failed to add to your list" });
    }
  });

  app.delete("/api/my-list/:movieId", requireAuth, async (req, res) => {
    try {
      const { movieId } = req.params;
      const userId = req.session.userId!;
      
      const removed = await storage.removeFromMyList(userId, movieId);
      if (!removed) {
        return res.status(404).json({ error: "Movie not found in your list" });
      }
      res.json({ message: "Removed from your list" });
    } catch (error) {
      console.error("Failed to remove from my list:", error);
      res.status(500).json({ error: "Failed to remove from your list" });
    }
  });

  app.get("/api/my-list/check/:movieId", requireAuth, async (req, res) => {
    try {
      const { movieId } = req.params;
      const userId = req.session.userId!;
      
      const isInList = await storage.isInMyList(userId, movieId);
      res.json({ inList: isInList });
    } catch (error) {
      console.error("Failed to check my list:", error);
      res.status(500).json({ error: "Failed to check your list" });
    }
  });

  // Payment and subscription routes
  app.get("/api/subscription/status", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const isSubscribed = await storage.isUserSubscribed(userId);
      const subscription = await storage.getUserSubscription(userId);
      
      res.json({
        isSubscribed,
        subscription: subscription || null,
      });
    } catch (error) {
      console.error("Failed to check subscription status:", error);
      res.status(500).json({ error: "Failed to check subscription status" });
    }
  });

  // Video purchase routes (pay-per-view)
  app.get("/api/videos/:movieId/purchased", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { movieId } = req.params;
      
      // First check if video is free
      const movie = await storage.getMovieById(movieId);
      if (movie && movie.isFree === 1) {
        return res.json({ isPurchased: true, isFree: true });
      }
      
      // Check if user has an active subscription (grants access to all movies)
      const isSubscribed = await storage.isUserSubscribed(userId);
      if (isSubscribed) {
        return res.json({ isPurchased: true, isFree: false, hasSubscription: true });
      }
      
      // If not subscribed, check if user has purchased this specific video
      const isPurchased = await storage.hasUserPurchasedVideo(userId, movieId);
      res.json({ isPurchased, isFree: false });
    } catch (error) {
      console.error("Failed to check video purchase status:", error);
      res.status(500).json({ error: "Failed to check purchase status" });
    }
  });

  app.post("/api/videos/:movieId/purchase", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { movieId } = req.params;
      
      // Use RaksmeyPay for video purchase - redirects to RaksmeyPay page with QR code
      const result = await paymentService.initiateVideoPurchase(userId, movieId);
      
      console.log(`[RaksmeyPay] Video purchase initiated for movie ${movieId}, checkout: ${result.checkoutUrl}`);
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Failed to initiate video purchase:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to initiate video purchase" });
    }
  });

  app.get("/api/payments/video-callback", async (req, res) => {
    try {
      const { success_time, success_amount, bakong_hash, success_hash, transaction_id, movieId } = req.query;
      
      console.log('[RaksemeyPay Video] Callback received:', {
        transaction_id,
        movieId,
        success_time,
        success_amount,
      });
      
      if (!success_time || !success_amount || !bakong_hash || !success_hash || !transaction_id || !movieId) {
        console.error('[RaksemeyPay Video] Missing required parameters');
        return res.redirect(`/?status=error&message=${encodeURIComponent('Missing payment parameters')}`);
      }

      // Verify payment and record video purchase
      const result = await paymentService.verifyVideoPurchase(transaction_id as string, movieId as string);
      
      if (result.status === 'completed') {
        console.log(`[RaksemeyPay Video] Video purchase completed for movie ${movieId}`);
        return res.redirect(`/?status=success&message=${encodeURIComponent('Video purchased successfully!')}&movieId=${movieId}`);
      } else {
        console.warn(`[RaksemeyPay Video] Payment not completed: ${result.status}`);
        return res.redirect(`/?status=pending&message=${encodeURIComponent('Payment is being processed')}`);
      }
    } catch (error) {
      console.error("Failed to process video purchase callback:", error);
      const message = error instanceof Error ? error.message : 'Unknown error';
      return res.redirect(`/?status=error&message=${encodeURIComponent(message)}`);
    }
  });

  // Manual video purchase verification endpoint - frontend polls this to check payment status
  app.post("/api/videos/:movieId/verify-purchase", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { movieId } = req.params;
      const { paymentRef } = req.body;

      if (!paymentRef) {
        return res.status(400).json({ error: "Payment reference required" });
      }

      console.log(`[Video Verify] Verifying purchase for user ${userId}, movie ${movieId}, ref ${paymentRef}`);

      // Check if already purchased (no need to verify again)
      const alreadyPurchased = await storage.hasUserPurchasedVideo(userId, movieId);
      if (alreadyPurchased) {
        return res.json({ isPurchased: true, status: 'completed' });
      }

      // Find the transaction and verify the user owns it
      const transaction = await storage.getPaymentTransactionByRef(paymentRef);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }

      if (transaction.userId !== userId) {
        return res.status(403).json({ error: "Transaction does not belong to this user" });
      }

      // For KHQR payments, return pending status - admin needs to confirm manually
      // KHQR payments go directly to Bakong account and cannot be verified via API
      if (transaction.paymentMethod === 'khqr') {
        console.log(`[KHQR Verify] Payment ${paymentRef} is KHQR - awaiting admin confirmation`);
        res.json({ 
          isPurchased: false,
          status: 'pending',
          message: 'Payment pending admin confirmation',
        });
        return;
      }

      // For RaksmeyPay payments, verify with their API
      const result = await paymentService.verifyVideoPurchase(paymentRef, movieId);
      
      res.json({ 
        isPurchased: result.status === 'completed',
        status: result.status,
      });
    } catch (error) {
      console.error("Failed to verify video purchase:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to verify purchase" });
    }
  });
  
  // Admin endpoint to confirm KHQR payment manually
  app.post("/api/admin/confirm-khqr-payment", requireAuth, requireAdmin, async (req, res) => {
    try {
      const { paymentRef, movieId } = req.body;
      
      if (!paymentRef || !movieId) {
        return res.status(400).json({ error: "Payment reference and movie ID required" });
      }
      
      const transaction = await storage.getPaymentTransactionByRef(paymentRef);
      if (!transaction) {
        return res.status(404).json({ error: "Transaction not found" });
      }
      
      if (transaction.paymentMethod !== 'khqr') {
        return res.status(400).json({ error: "This is not a KHQR payment" });
      }
      
      // Mark transaction as completed
      await storage.updatePaymentTransaction(transaction.id, {
        status: 'completed',
        completedAt: Math.floor(Date.now() / 1000),
      });
      
      // Record video purchase
      await storage.createVideoPurchase({
        userId: transaction.userId,
        movieId: movieId,
        amount: transaction.amount,
        currency: 'USD',
        transactionRef: paymentRef,
      });
      
      console.log(`[KHQR Admin] Payment ${paymentRef} confirmed for movie ${movieId}`);
      res.json({ success: true, message: 'Payment confirmed' });
    } catch (error) {
      console.error("Failed to confirm KHQR payment:", error);
      res.status(500).json({ error: "Failed to confirm payment" });
    }
  });

  app.post("/api/payments/initiate", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const paymentData = await paymentService.initiatePayment(userId);
      
      res.status(201).json(paymentData);
    } catch (error) {
      console.error("Failed to initiate payment:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to initiate payment" });
    }
  });

  app.post("/api/payments/webhook", async (req, res) => {
    try {
      const signature = req.headers['x-raksmeypay-signature'] as string || '';
      await paymentService.handleWebhook(req.body, signature);
      
      res.json({ message: "Webhook processed successfully" });
    } catch (error) {
      console.error("Failed to process webhook:", error);
      res.status(400).json({ error: "Failed to process webhook" });
    }
  });

  app.post("/api/payments/verify/:paymentRef", requireAuth, async (req, res) => {
    try {
      const { paymentRef } = req.params;
      const result = await paymentService.verifyPayment(paymentRef);
      
      res.json(result);
    } catch (error) {
      console.error("Failed to verify payment:", error);
      if (error instanceof Error) {
        return res.status(400).json({ error: error.message });
      }
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  // RaksemeyPay callback endpoint - handles redirect after payment
  // Parameters based on official RaksemeyPay PHP validation example
  app.get("/api/payments/callback", async (req, res) => {
    try {
      const { success_time, success_amount, bakong_hash, success_hash, transaction_id } = req.query;
      
      console.log('[RaksemeyPay] Callback received:', {
        transaction_id,
        success_time,
        success_amount,
        has_bakong_hash: !!bakong_hash,
        has_success_hash: !!success_hash,
      });
      
      if (!success_time || !success_amount || !bakong_hash || !success_hash || !transaction_id) {
        console.error('[RaksemeyPay] Missing required parameters');
        return res.redirect(`/payments/result?status=error&message=Missing+required+parameters`);
      }
      
      // Validate callback using RealRaksemeyPayProvider
      const { RealRaksmeyPayProvider } = await import('./payment-provider');
      if (paymentProvider instanceof RealRaksmeyPayProvider) {
        const validation = paymentProvider.validateCallback({
          success_time: success_time as string,
          success_amount: success_amount as string,
          bakong_hash: bakong_hash as string,
          success_hash: success_hash as string,
          transaction_id: transaction_id as string,
        });
        
        if (!validation.isValid) {
          const errorMsg = validation.errorMessage || 'Invalid payment signature';
          console.error('[RaksemeyPay] Callback validation failed:', errorMsg);
          return res.redirect(`/payments/result?status=error&message=${encodeURIComponent(errorMsg)}`);
        }
        
        // Find transaction
        const transaction = await storage.getPaymentTransaction(validation.paymentRef);
        if (!transaction) {
          console.error('[RaksemeyPay] Transaction not found:', validation.paymentRef);
          return res.redirect(`/payments/result?status=error&message=Transaction+not+found`);
        }
        
        // Validate payment amount from callback
        const callbackAmount = parseFloat(success_amount as string);
        const expectedAmount = parseFloat(transaction.amount);
        
        if (Math.abs(callbackAmount - expectedAmount) > 0.01) {
          console.error('[RaksemeyPay] Amount mismatch - Expected:', expectedAmount, 'Callback:', callbackAmount);
          return res.redirect(`/payments/result?status=error&message=Payment+amount+mismatch`);
        }
        
        // OPTIONAL: Double-check with RaksemeyPay's verification API
        // This adds an extra security layer while tolerating transient API issues
        try {
          console.log('[RaksemeyPay] Attempting verification API check...');
          const verificationResult = await paymentProvider.verifyPayment(validation.paymentRef);
          
          if (verificationResult.status === 'completed') {
            // SUCCESS - verify amount matches (with tolerance for floating point)
            const verifiedAmount = verificationResult.amount;
            const expectedAmountNum = parseFloat(transaction.amount);
            if (verifiedAmount > 0 && Math.abs(verifiedAmount - expectedAmountNum) > 0.01) {
              console.error('[RaksemeyPay] API amount mismatch - Expected:', expectedAmountNum, 'Verified:', verifiedAmount);
              return res.redirect(`/payments/result?status=error&message=Payment+amount+mismatch`);
            }
            console.log('[RaksemeyPay] API verification passed - Status: SUCCESS, Amount:', verifiedAmount);
          } else if (verificationResult.status === 'failed' || verificationResult.status === 'cancelled') {
            // EXPLICIT FAILURE - RaksemeyPay says payment definitively failed
            console.error('[RaksemeyPay] API verification says payment FAILED/CANCELLED');
            return res.redirect(`/payments/result?status=error&message=Payment+verification+failed`);
          } else {
            // PENDING or UNKNOWN - might be eventual consistency, proceed with callback validation
            console.warn('[RaksemeyPay] API verification returned:', verificationResult.status, '- proceeding (may be eventual consistency)');
          }
        } catch (apiError) {
          // API call failed (network error, timeout, etc.) - log but don't fail the payment
          // Callback signature is our primary security layer
          console.warn('[RaksemeyPay] Verification API call failed (proceeding with callback):', apiError instanceof Error ? apiError.message : String(apiError));
        }
        
        // Mark payment as completed (idempotent)
        if (transaction.status === 'pending') {
          await storage.updatePaymentTransaction(transaction.id, {
            status: 'completed',
            transactionRef: bakong_hash as string, // Store Bakong transaction reference
            completedAt: parseInt(success_time as string, 10),
          });
          
          // Activate subscription via PaymentService
          await (paymentService as any).activateSubscription(transaction.userId, transaction.planId);
          
          console.log(`[RaksemeyPay] Payment ${validation.paymentRef} completed successfully`);
          console.log(`[RaksemeyPay] Amount: ${success_amount}, Bakong Hash: ${bakong_hash}`);
        } else {
          console.log(`[RaksemeyPay] Payment ${validation.paymentRef} already processed (status: ${transaction.status})`);
        }
        
        // Redirect to success page with payment ref
        return res.redirect(`/payments/result?status=success&ref=${validation.paymentRef}`);
        
      } else {
        // Mock provider doesn't use callback - this shouldn't happen
        console.error('[RaksemeyPay] Callback received but using MockProvider');
        return res.redirect(`/payments/result?status=error&message=Invalid+provider+configuration`);
      }
      
    } catch (error) {
      console.error("Failed to process callback:", error);
      const message = error instanceof Error ? error.message : 'Unknown+error';
      return res.redirect(`/payments/result?status=error&message=${encodeURIComponent(message)}`);
    }
  });

  // Mock payment endpoints (DEVELOPMENT/TESTING ONLY - REMOVE FOR PRODUCTION)
  // This endpoint should ONLY be used for local development and testing
  // It will be completely removed and replaced with real RaksemeyPay webhook when API is available
  app.post("/api/payments/mock/complete/:paymentRef", requireAuth, async (req, res) => {
    try {
      // SECURITY LAYER 1: Only allow in development mode
      if (process.env.NODE_ENV === 'production') {
        return res.status(403).json({ error: "Mock endpoints disabled in production" });
      }
      
      // SECURITY LAYER 2: Require special dev secret (prevents unauthorized use)
      const devSecret = req.headers['x-dev-secret'];
      const expectedSecret = process.env.MOCK_PAYMENT_SECRET || 'dev-only-secret-12345';
      
      if (devSecret !== expectedSecret) {
        console.warn(`Mock payment attempt with invalid secret from user: ${req.session.userId}`);
        return res.status(403).json({ error: "Unauthorized - Invalid dev secret" });
      }
      
      const { paymentRef } = req.params;
      const userId = req.session.userId!;
      
      // This is a dev-only endpoint to simulate payment success
      if (paymentProvider instanceof (await import('./payment-provider')).MockRaksmeyPayProvider) {
        // SECURITY LAYER 3: Verify the payment belongs to the current user
        const transaction = await storage.getPaymentTransaction(paymentRef);
        if (!transaction) {
          return res.status(404).json({ error: "Payment not found" });
        }
        
        if (transaction.userId !== userId) {
          return res.status(403).json({ error: "Unauthorized - This payment belongs to another user" });
        }
        
        console.log(`[DEV] Simulating payment success for ref: ${paymentRef}, user: ${userId}`);
        
        // Simulate payment success
        (paymentProvider as any).simulatePaymentSuccess(paymentRef);
        
        // Verify and process the payment
        const result = await paymentService.verifyPayment(paymentRef);
        res.json(result);
      } else {
        res.status(403).json({ error: "Mock endpoints only available with MockRaksmeyPayProvider" });
      }
    } catch (error) {
      console.error("Failed to complete mock payment:", error);
      res.status(500).json({ error: "Failed to complete mock payment" });
    }
  });

  // Admin routes for users
  app.get("/api/admin/users", requireAdminRole("full"), async (_req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords in response
      const usersWithoutPasswords = users.map(({ password, ...user }) => user);
      res.json(usersWithoutPasswords);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  app.delete("/api/admin/users/:id", requireAdminRole("full"), async (req, res) => {
    try {
      const deleted = await storage.deleteUser(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "User not found" });
      }
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete user" });
    }
  });

  // Admin route to give credits to all users
  app.post("/api/admin/users/give-credits", requireAdminRole("full"), async (req, res) => {
    try {
      const { amount } = req.body;
      
      // Validate amount (1-100 USD)
      const creditAmount = parseFloat(amount);
      if (isNaN(creditAmount) || creditAmount < 1 || creditAmount > 100) {
        return res.status(400).json({ error: "Amount must be between $1 and $100" });
      }
      
      // Get all users and add credits
      const users = await storage.getAllUsers();
      let updatedCount = 0;
      
      for (const user of users) {
        const currentBalance = parseFloat(user.balance || "0");
        const newBalance = currentBalance + creditAmount;
        await storage.updateUserBalance(user.id, newBalance.toFixed(2));
        updatedCount++;
      }
      
      res.json({ 
        success: true, 
        message: `Added $${creditAmount.toFixed(2)} credit to ${updatedCount} users`,
        usersUpdated: updatedCount,
        amountPerUser: creditAmount.toFixed(2)
      });
    } catch (error) {
      console.error("Failed to give credits:", error);
      res.status(500).json({ error: "Failed to give credits to users" });
    }
  });

  // Admin route to add credit to individual user
  app.post("/api/admin/users/:id/credit", requireAdminRole("full"), async (req, res) => {
    try {
      const { id } = req.params;
      const { amount } = req.body;
      
      // Validate amount (0.5-100 USD)
      const creditAmount = parseFloat(amount);
      if (isNaN(creditAmount) || creditAmount < 0.5 || creditAmount > 100) {
        return res.status(400).json({ error: "Amount must be between $0.50 and $100" });
      }
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      const currentBalance = parseFloat(user.balance || "0");
      const newBalance = currentBalance + creditAmount;
      await storage.updateUserBalance(id, newBalance.toFixed(2));
      
      res.json({ 
        success: true, 
        message: `Added $${creditAmount.toFixed(2)} to ${user.fullName}`,
        newBalance: newBalance.toFixed(2)
      });
    } catch (error) {
      console.error("Failed to add credit:", error);
      res.status(500).json({ error: "Failed to add credit" });
    }
  });

  // Admin route to toggle trusted user status (skip DevTools detection)
  app.patch("/api/admin/users/:id/trusted", requireAdminRole("full"), async (req, res) => {
    try {
      const { id } = req.params;
      const { trusted } = req.body;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.updateUserTrustedStatus(id, trusted ? 1 : 0);
      res.json({ success: true, message: `User trusted status updated` });
    } catch (error) {
      console.error("Failed to update trusted status:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Admin route to toggle no watermark status (remove watermark from videos)
  app.patch("/api/admin/users/:id/watermark", requireAdminRole("full"), async (req, res) => {
    try {
      const { id } = req.params;
      const { noWatermark } = req.body;
      
      const user = await storage.getUser(id);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      await storage.updateUserNoWatermarkStatus(id, noWatermark ? 1 : 0);
      res.json({ success: true, message: `User watermark status updated` });
    } catch (error) {
      console.error("Failed to update watermark status:", error);
      res.status(500).json({ error: "Failed to update user" });
    }
  });

  // Admin routes for movies
  app.post("/api/admin/movies", requireAdminRole("full", "video"), async (req, res) => {
    try {
      const validatedData = insertMovieSchema.parse(req.body);
      const movie = await storage.createMovie(validatedData);
      res.status(201).json(movie);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid movie data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create movie" });
    }
  });

  app.post("/api/admin/movies/bulk", requireAdminRole("full", "video"), async (req, res) => {
    try {
      const moviesArray = z.array(insertMovieSchema).parse(req.body);
      const createdMovies = [];
      
      for (const movieData of moviesArray) {
        const movie = await storage.createMovie(movieData);
        createdMovies.push(movie);
      }
      
      res.status(201).json({ 
        success: true, 
        count: createdMovies.length,
        movies: createdMovies 
      });
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid movie data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to bulk create movies" });
    }
  });

  app.put("/api/admin/movies/:id", requireAdminRole("full", "video"), async (req, res) => {
    try {
      const validatedData = insertMovieSchema.partial().parse(req.body);
      
      // Filter out undefined values to prevent resetting fields to defaults
      const updateData = Object.fromEntries(
        Object.entries(validatedData).filter(([_, value]) => value !== undefined)
      );
      
      const movie = await storage.updateMovie(req.params.id, updateData);
      if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
      }
      res.json(movie);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid movie data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to update movie" });
    }
  });

  app.delete("/api/admin/movies/:id", requireAdminRole("full", "video"), async (req, res) => {
    try {
      const deleted = await storage.deleteMovie(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Movie not found" });
      }
      res.json({ message: "Movie deleted successfully" });
    } catch (error) {
      res.status(500).json({ error: "Failed to delete movie" });
    }
  });

  // Admin Analytics routes
  app.get("/api/admin/analytics/overview", requireAdminRole("full"), async (_req, res) => {
    try {
      const analytics = await storage.getAnalytics();
      res.json(analytics);
    } catch (error) {
      console.error("Analytics overview error:", error);
      res.status(500).json({ error: "Failed to fetch analytics" });
    }
  });

  app.get("/api/admin/analytics/top-movies", requireAdminRole("full"), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topMovies = await storage.getTopMovies(limit);
      res.json(topMovies);
    } catch (error) {
      console.error("Top movies error:", error);
      res.status(500).json({ error: "Failed to fetch top movies" });
    }
  });

  app.get("/api/admin/analytics/top-genres", requireAdminRole("full"), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 10;
      const topGenres = await storage.getTopGenres(limit);
      res.json(topGenres);
    } catch (error) {
      console.error("Top genres error:", error);
      res.status(500).json({ error: "Failed to fetch top genres" });
    }
  });

  app.get("/api/admin/analytics/revenue", requireAdminRole("full"), async (req, res) => {
    try {
      const months = parseInt(req.query.months as string) || 6;
      const revenue = await storage.getRevenueByMonth(months);
      res.json(revenue);
    } catch (error) {
      console.error("Revenue error:", error);
      res.status(500).json({ error: "Failed to fetch revenue data" });
    }
  });

  app.get("/api/admin/analytics/payment-issues", requireAdminRole("full"), async (_req, res) => {
    try {
      const issues = await storage.getPaymentIssues();
      res.json(issues);
    } catch (error) {
      console.error("Payment issues error:", error);
      res.status(500).json({ error: "Failed to fetch payment issues" });
    }
  });

  app.get("/api/admin/analytics/recent-activity", requireAdminRole("full"), async (req, res) => {
    try {
      const limit = parseInt(req.query.limit as string) || 20;
      const activity = await storage.getRecentActivity(limit);
      res.json(activity);
    } catch (error) {
      console.error("Recent activity error:", error);
      res.status(500).json({ error: "Failed to fetch recent activity" });
    }
  });

  // Admin Ad Banner routes
  app.get("/api/admin/banners", requireAdminRole("full"), async (_req, res) => {
    try {
      const banners = await storage.getAllAdBanners();
      res.json(banners);
    } catch (error) {
      console.error("Get banners error:", error);
      res.status(500).json({ error: "Failed to fetch ad banners" });
    }
  });

  app.post("/api/admin/banners", requireAdminRole("full"), async (req, res) => {
    try {
      const validatedData = insertAdBannerSchema.parse(req.body);
      const banner = await storage.createAdBanner(validatedData);
      res.status(201).json(banner);
    } catch (error) {
      console.error("Create banner error:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: "Invalid banner data", details: error.errors });
      }
      res.status(500).json({ error: "Failed to create ad banner" });
    }
  });

  app.put("/api/admin/banners/:id", requireAdminRole("full"), async (req, res) => {
    try {
      const banner = await storage.updateAdBanner(req.params.id, req.body);
      if (!banner) {
        return res.status(404).json({ error: "Ad banner not found" });
      }
      res.json(banner);
    } catch (error) {
      console.error("Update banner error:", error);
      res.status(500).json({ error: "Failed to update ad banner" });
    }
  });

  app.delete("/api/admin/banners/:id", requireAdminRole("full"), async (req, res) => {
    try {
      const deleted = await storage.deleteAdBanner(req.params.id);
      if (!deleted) {
        return res.status(404).json({ error: "Ad banner not found" });
      }
      res.json({ message: "Ad banner deleted successfully" });
    } catch (error) {
      console.error("Delete banner error:", error);
      res.status(500).json({ error: "Failed to delete ad banner" });
    }
  });

  // Public Ad Banner route (for displaying on website)
  app.get("/api/banners/active", async (_req, res) => {
    try {
      const banners = await storage.getActiveAdBanners();
      res.json(banners);
    } catch (error) {
      console.error("Get active banners error:", error);
      res.status(500).json({ error: "Failed to fetch active ad banners" });
    }
  });

  // Admin Change Password route
  app.put("/api/admin/change-password", requireAdmin, async (req, res) => {
    try {
      const { currentPassword, newPassword } = req.body;
      
      if (!currentPassword || !newPassword) {
        return res.status(400).json({ error: "Current password and new password are required" });
      }
      
      if (newPassword.length < 6) {
        return res.status(400).json({ error: "New password must be at least 6 characters" });
      }
      
      const user = await storage.getUser(req.session.userId!);
      if (!user) {
        return res.status(404).json({ error: "User not found" });
      }
      
      // Verify current password
      const isPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isPasswordValid) {
        return res.status(401).json({ error: "Current password is incorrect" });
      }
      
      // Hash and update new password
      const hashedPassword = await bcrypt.hash(newPassword, 10);
      await storage.updateUser(req.session.userId!, { password: hashedPassword });
      
      res.json({ message: "Password changed successfully" });
    } catch (error) {
      console.error("Change password error:", error);
      res.status(500).json({ error: "Failed to change password" });
    }
  });

  app.post("/api/movies/:movieId/track-view", requireAuth, async (req, res) => {
    try {
      const { watchDuration } = req.body;
      await storage.trackMovieView({
        userId: req.session.userId!,
        movieId: req.params.movieId,
        watchDuration: watchDuration || 0,
      });
      res.json({ success: true });
    } catch (error) {
      console.error("Track view error:", error);
      res.status(500).json({ error: "Failed to track view" });
    }
  });

  // Public movie routes - specific routes must come before parameterized routes
  app.get("/api/movies/hero-banner", async (req, res) => {
    try {
      const movie = await storage.getHeroBannerMovie();
      res.json(movie || null);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch hero banner movie" });
    }
  });

  app.get("/api/movies/trending", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.getTrendingMovies(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch trending movies" });
    }
  });

  app.get("/api/movies/new-and-popular", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.getNewAndPopularMovies(page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch new and popular movies" });
    }
  });

  app.get("/api/movies/search/:query", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.searchMovies(req.params.query, page, limit);
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to search movies" });
    }
  });

  app.get("/api/movies/genre/:genre", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.getMoviesByGenre(req.params.genre, page, limit);
      // Cache genre results
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      res.json(result);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch movies by genre" });
    }
  });

  app.get("/api/movies/:id", async (req, res) => {
    try {
      const movie = await storage.getMovieById(req.params.id);
      if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
      }
      
      // SECURITY: Hide videoEmbedUrl unless user has access
      let canAccessVideo = false;
      
      // Check if video is free
      if (movie.isFree === 1) {
        canAccessVideo = true;
      } else if (req.session?.userId) {
        // Check if user has purchased this video
        const userId = req.session.userId;
        const hasPurchased = await storage.hasUserPurchasedVideo(userId, movie.id);
        const isSubscribed = await storage.isUserSubscribed(userId);
        canAccessVideo = hasPurchased || isSubscribed;
      }
      
      // Remove videoEmbedUrl if user doesn't have access
      const safeMovie = {
        ...movie,
        videoEmbedUrl: canAccessVideo ? movie.videoEmbedUrl : null,
      };
      
      // Cache individual movie data (shorter cache for authenticated requests)
      if (req.session?.userId) {
        res.set('Cache-Control', 'private, max-age=30');
      } else {
        res.set('Cache-Control', 'public, max-age=120, stale-while-revalidate=600');
      }
      res.json(safeMovie);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch movie" });
    }
  });
  
  // Secure endpoint to get video access token (not the URL)
  app.get("/api/videos/:movieId/stream", requireAuth, async (req, res) => {
    try {
      const userId = req.session.userId!;
      const { movieId } = req.params;
      
      const movie = await storage.getMovieById(movieId);
      if (!movie) {
        return res.status(404).json({ error: "Movie not found" });
      }
      
      // Check access: free video, purchased, or subscribed
      let hasAccess = false;
      
      if (movie.isFree === 1) {
        hasAccess = true;
      } else {
        const hasPurchased = await storage.hasUserPurchasedVideo(userId, movieId);
        const isSubscribed = await storage.isUserSubscribed(userId);
        hasAccess = hasPurchased || isSubscribed;
      }
      
      if (!hasAccess) {
        return res.status(403).json({ error: "Video not purchased. Please purchase to watch." });
      }
      
      // Check if user is trusted (skip DevTools detection)
      const user = await storage.getUser(userId);
      const isTrusted = user?.trustedUser === 1 ? 1 : 0;
      
      // Generate a secure token that expires in 2 hours
      const crypto = await import('crypto');
      const timestamp = Date.now();
      const expiry = timestamp + (2 * 60 * 60 * 1000); // 2 hours
      const tokenData = `${userId}:${movieId}:${expiry}:${isTrusted}`;
      const secret = process.env.SESSION_SECRET || 'video-secret-key';
      const signature = crypto.createHmac('sha256', secret).update(tokenData).digest('hex');
      const token = Buffer.from(`${tokenData}:${signature}`).toString('base64url');
      
      // Return token-based proxy URL (hides real video source)
      res.json({ 
        videoUrl: `/api/v/play/${token}`,
        title: movie.title,
      });
    } catch (error) {
      console.error("Failed to get video stream:", error);
      res.status(500).json({ error: "Failed to get video" });
    }
  });

  // Video proxy endpoint - serves video player page without exposing source
  app.get("/api/v/play/:token", async (req, res) => {
    try {
      const { token } = req.params;
      const crypto = await import('crypto');
      const secret = process.env.SESSION_SECRET || 'video-secret-key';
      
      // Decode and verify token
      const decoded = Buffer.from(token, 'base64url').toString();
      const parts = decoded.split(':');
      if (parts.length !== 5) {
        return res.status(403).send('Invalid token');
      }
      
      const [userId, movieId, expiryStr, trustedStr, signature] = parts;
      const expiry = parseInt(expiryStr);
      const isTrusted = trustedStr === '1';
      
      // Check expiry
      if (Date.now() > expiry) {
        return res.status(403).send('Token expired');
      }
      
      // Verify signature
      const tokenData = `${userId}:${movieId}:${expiryStr}:${trustedStr}`;
      const expectedSignature = crypto.createHmac('sha256', secret).update(tokenData).digest('hex');
      if (signature !== expectedSignature) {
        return res.status(403).send('Invalid signature');
      }
      
      // Get the movie
      const movie = await storage.getMovieById(movieId);
      if (!movie || !movie.videoEmbedUrl) {
        return res.status(404).send('Video not found');
      }
      
      // Process embed URL with player parameters
      let embedUrl = movie.videoEmbedUrl;
      
      // Add parameters based on video provider
      if (embedUrl.includes('vimeo.com')) {
        const vimeoParams = 'autoplay=1&badge=0&title=0&byline=0&portrait=0&controls=1&dnt=1';
        if (!embedUrl.includes('player.vimeo.com')) {
          const vimeoMatch = embedUrl.match(/vimeo\.com\/(\d+)/);
          if (vimeoMatch) {
            embedUrl = `https://player.vimeo.com/video/${vimeoMatch[1]}?${vimeoParams}`;
          }
        } else if (!embedUrl.includes('?')) {
          embedUrl += '?' + vimeoParams;
        }
      } else if (embedUrl.includes('youtube.com') || embedUrl.includes('youtu.be')) {
        if (!embedUrl.includes('/embed/')) {
          const ytMatch = embedUrl.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([a-zA-Z0-9_-]+)/);
          if (ytMatch) {
            embedUrl = `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1&rel=0`;
          }
        }
      } else if (!embedUrl.includes('autoplay')) {
        embedUrl += (embedUrl.includes('?') ? '&' : '?') + 'autoplay=1';
      }
      
      // Serve an HTML page with obfuscated video source
      res.setHeader('Content-Type', 'text/html');
      res.setHeader('X-Frame-Options', 'SAMEORIGIN');
      res.setHeader('Content-Security-Policy', "frame-ancestors 'self'");
      
      // Obfuscate the URL using multiple layers
      const urlBytes = Buffer.from(embedUrl).toString('base64');
      // Split into chunks to make it harder to find
      const chunks = urlBytes.match(/.{1,10}/g) || [urlBytes];
      const chunksJson = JSON.stringify(chunks);
      
      // Generate random variable names to prevent pattern matching
      const varA = '_' + Math.random().toString(36).substring(2, 8);
      const varB = '_' + Math.random().toString(36).substring(2, 8);
      const varC = '_' + Math.random().toString(36).substring(2, 8);
      const varD = '_' + Math.random().toString(36).substring(2, 8);
      
      res.send(`<!DOCTYPE html>
<html><head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>Stream</title>
<style>
*{margin:0;padding:0;box-sizing:border-box}
html,body{width:100%;height:100%;background:#000;overflow:hidden}
#p{position:absolute;top:0;left:0;width:100%;height:100%}
#v{position:absolute;top:0;left:0;width:100%;height:100%;border:none;z-index:1}
.b{position:absolute;z-index:10;background:transparent}
.tl{top:0;left:0;width:200px;height:80px}
.tr{top:0;right:0;width:200px;height:80px}
.bl{bottom:0;left:0;width:200px;height:80px}
.br{bottom:0;right:0;width:200px;height:80px}
.ct{top:0;left:50%;transform:translateX(-50%);width:300px;height:60px}
.cb{bottom:0;left:50%;transform:translateX(-50%);width:300px;height:60px}
</style>
</head><body>
<div id="p">
  <div class="b tl"></div>
  <div class="b tr"></div>
  <div class="b bl"></div>
  <div class="b br"></div>
  <div class="b ct"></div>
  <div class="b cb"></div>
</div>
<script>
(function(){
  var ${varA}=${chunksJson};
  var ${varB}=${varA}.join('');
  var ${varC}=atob(${varB});
  var ${varD}=document.createElement('iframe');
  ${varD}.id='v';
  ${varD}.src=${varC};
  ${varD}.allow='accelerometer;autoplay;clipboard-write;encrypted-media;gyroscope;picture-in-picture;web-share';
  ${varD}.allowFullscreen=true;
  ${varD}.setAttribute('sandbox','allow-scripts allow-same-origin allow-presentation allow-popups');
  document.getElementById('p').insertBefore(${varD},document.getElementById('p').firstChild);
  
  // Block all clicks on overlays
  document.querySelectorAll('.b').forEach(function(el){
    el.addEventListener('click',function(e){e.preventDefault();e.stopPropagation();});
    el.addEventListener('mousedown',function(e){e.preventDefault();e.stopPropagation();});
  });
  
  // Block new window/tab attempts
  window.addEventListener('beforeunload',function(e){e.preventDefault();});
  
  // Block all link clicks
  document.addEventListener('click',function(e){
    if(e.target.tagName==='A'||e.target.closest('a')){e.preventDefault();}
  },true);
  
  // Block window.open
  window.open=function(){return null;};
  
  // Block right-click
  document.addEventListener('contextmenu',function(e){e.preventDefault()});
  
  // Block keyboard shortcuts
  document.addEventListener('keydown',function(e){
    if((e.ctrlKey||e.metaKey)&&(e.key==='u'||e.key==='s'||e.key==='i'||e.key==='j'||e.key==='c')){e.preventDefault()}
    if(e.key==='F12'){e.preventDefault()}
  });
  
  // Block drag
  document.addEventListener('dragstart',function(e){e.preventDefault()});
})();
</script>
</body></html>`);
    } catch (error) {
      console.error("Video proxy error:", error);
      res.status(500).send('Error loading video');
    }
  });

  app.get("/api/movies", async (req, res) => {
    try {
      const page = parseInt(req.query.page as string) || 1;
      const limit = parseInt(req.query.limit as string) || 20;
      const result = await storage.getAllMovies(page, limit);
      
      // SECURITY: Remove videoEmbedUrl from all movies in list view
      // Users must use the secure /api/videos/:movieId/stream endpoint after purchase
      const safeMovies = result.movies.map(movie => ({
        ...movie,
        videoEmbedUrl: null, // Hide video URL from list
      }));
      
      // Add cache headers for faster loading
      res.set('Cache-Control', 'public, max-age=60, stale-while-revalidate=300');
      res.json({ ...result, movies: safeMovies });
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch movies" });
    }
  });

  // Security logging endpoint (requires authentication)
  app.post("/api/security/log", requireAuth, async (req, res) => {
    try {
      const { eventType, details, userAgent, timestamp } = req.body;
      const userId = req.session.userId;
      
      // Only log authenticated users
      if (!userId) {
        return res.status(401).json({ error: "Unauthorized" });
      }
      
      // Log security event (console for now, could be stored in DB)
      console.log(`[SECURITY] Event: ${eventType} | User: ${userId} | Details: ${details} | UA: ${userAgent} | Time: ${timestamp}`);
      
      // Could optionally store in database here for analytics
      // await storage.logSecurityEvent({ userId, eventType, details, userAgent, timestamp });
      
      res.json({ success: true });
    } catch (error) {
      console.error("Failed to log security event:", error);
      res.status(500).json({ error: "Failed to log event" });
    }
  });

  const httpServer = createServer(app);

  return httpServer;
}
