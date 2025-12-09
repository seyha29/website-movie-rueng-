import { storage } from "./storage";
import { type PaymentProvider } from "./payment-provider";
import crypto from "crypto";

export class PaymentService {
  constructor(private paymentProvider: PaymentProvider) {}

  async initiatePayment(userId: string) {
    // 1. Check if user already has active subscription
    const isSubscribed = await storage.isUserSubscribed(userId);
    if (isSubscribed) {
      throw new Error('User already has active subscription');
    }

    // 2. Get the monthly plan
    const plan = await storage.getMonthlyPlan();
    if (!plan) {
      throw new Error('Monthly subscription plan not found');
    }

    // 3. Create pending payment transaction
    const paymentRef = crypto.randomBytes(16).toString('hex');
    const transaction = await storage.createPaymentTransaction({
      userId,
      planId: plan.id,
      amount: plan.price.toString(),
      currency: plan.currency,
      status: 'pending',
      paymentMethod: 'raksmeypay',
      transactionRef: paymentRef,
    });

    // 4. Initiate payment with provider
    // Use Replit dev domain for callback (RaksemeyPay needs publicly accessible URL)
    const baseUrl = process.env.BASE_URL || 
                    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000');
    const callbackUrl = `${baseUrl}/api/payments/callback`;
    
    console.log(`[Payment] Using callback URL: ${callbackUrl}`);
    
    const paymentResponse = await this.paymentProvider.initiatePayment({
      userId,
      planId: plan.id,
      amount: parseFloat(plan.price),
      currency: plan.currency,
      callbackUrl,
    });

    // 5. Update transaction with payment provider's reference
    await storage.updatePaymentTransaction(transaction.id, {
      transactionRef: paymentResponse.paymentRef,
    });

    return {
      paymentId: transaction.id,
      paymentRef: paymentResponse.paymentRef,
      checkoutUrl: paymentResponse.checkoutUrl,
      amount: plan.price,
      currency: plan.currency,
    };
  }

  async initiateVideoPurchase(userId: string, movieId: string) {
    // 1. Check if user already purchased this video
    const alreadyPurchased = await storage.hasUserPurchasedVideo(userId, movieId);
    if (alreadyPurchased) {
      throw new Error('Video already purchased');
    }

    // 2. Verify movie exists
    const movie = await storage.getMovieById(movieId);
    if (!movie) {
      throw new Error('Movie not found');
    }

    // 3. Create pending payment transaction for video purchase
    const paymentRef = crypto.randomBytes(16).toString('hex');
    const videoPurchaseAmount = 1; // $1 per video
    
    // Get or create a "video purchase" plan (we still use plan structure for consistency)
    const plan = await storage.getMonthlyPlan(); // We'll reuse plan structure for transaction record
    if (!plan) {
      throw new Error('Payment plan not configured');
    }

    const transaction = await storage.createPaymentTransaction({
      userId,
      planId: plan.id, // Reference plan but won't activate subscription
      amount: videoPurchaseAmount.toString(),
      currency: 'USD',
      status: 'pending',
      paymentMethod: 'raksmeypay',
      transactionRef: paymentRef,
    });

    // 4. Initiate payment with provider
    const baseUrl = process.env.BASE_URL || 
                    (process.env.REPLIT_DEV_DOMAIN ? `https://${process.env.REPLIT_DEV_DOMAIN}` : 'http://localhost:5000');
    const callbackUrl = `${baseUrl}/api/payments/video-callback?movieId=${encodeURIComponent(movieId)}`;
    
    console.log(`[Video Payment] Using callback URL: ${callbackUrl}`);
    
    const paymentResponse = await this.paymentProvider.initiatePayment({
      userId,
      planId: plan.id,
      amount: videoPurchaseAmount,
      currency: 'USD',
      callbackUrl,
    });

    // 5. Update transaction with payment provider's reference
    await storage.updatePaymentTransaction(transaction.id, {
      transactionRef: paymentResponse.paymentRef,
    });

    return {
      paymentId: transaction.id,
      paymentRef: paymentResponse.paymentRef,
      checkoutUrl: paymentResponse.checkoutUrl,
      amount: videoPurchaseAmount.toString(),
      currency: 'USD',
      movieId,
      movieTitle: movie.title,
    };
  }

  async verifyPayment(paymentRef: string) {
    // 1. Verify payment with provider
    const verificationResult = await this.paymentProvider.verifyPayment(paymentRef);

    // 2. Find transaction by provider reference
    const transaction = await this.findTransactionByProviderRef(paymentRef);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // 3. Update transaction status (idempotent - only if still pending)
    if (transaction.status === 'pending') {
      // Re-check subscription status to prevent double-subscription
      const alreadySubscribed = await storage.isUserSubscribed(transaction.userId);
      
      await storage.updatePaymentTransaction(transaction.id, {
        status: verificationResult.status,
        transactionRef: verificationResult.transactionId || verificationResult.paymentRef,
        completedAt: verificationResult.paidAt,
      });

      // 4. If payment successful AND user not already subscribed, activate subscription
      if (verificationResult.status === 'completed' && !alreadySubscribed) {
        await this.activateSubscription(transaction.userId, transaction.planId);
      }
    }

    return {
      status: verificationResult.status,
      paymentId: transaction.id,
    };
  }

  async verifyVideoPurchase(paymentRef: string, movieId: string) {
    // 1. Verify payment with provider
    const verificationResult = await this.paymentProvider.verifyPayment(paymentRef);

    // 2. Find transaction by provider reference
    const transaction = await this.findTransactionByProviderRef(paymentRef);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // 3. Update transaction status (idempotent - only if still pending)
    if (transaction.status === 'pending') {
      await storage.updatePaymentTransaction(transaction.id, {
        status: verificationResult.status,
        transactionRef: verificationResult.transactionId || verificationResult.paymentRef,
        completedAt: verificationResult.paidAt,
      });

      // 4. If payment successful, record video purchase and add to My List
      if (verificationResult.status === 'completed') {
        // Re-check to prevent duplicate purchases
        const alreadyPurchased = await storage.hasUserPurchasedVideo(transaction.userId, movieId);
        
        if (!alreadyPurchased) {
          // Record the video purchase
          await storage.createVideoPurchase({
            userId: transaction.userId,
            movieId,
            amount: transaction.amount,
            currency: transaction.currency,
            transactionRef: paymentRef,
          });

          // Auto-add to My List
          const isInMyList = await storage.isInMyList(transaction.userId, movieId);
          if (!isInMyList) {
            await storage.addToMyList(transaction.userId, movieId);
          }
        }
      }
    }

    return {
      status: verificationResult.status,
      paymentId: transaction.id,
      movieId,
    };
  }

  async handleWebhook(body: any, signature: string) {
    // 1. Parse and verify webhook
    const webhookData = await this.paymentProvider.parseWebhook(body, signature);

    // 2. Find transaction
    const transaction = await this.findTransactionByProviderRef(webhookData.paymentRef);
    if (!transaction) {
      throw new Error('Transaction not found');
    }

    // 3. Idempotent update - only process if still pending
    if (transaction.status === 'pending') {
      // Re-check subscription status to prevent double-subscription
      const alreadySubscribed = await storage.isUserSubscribed(transaction.userId);
      
      await storage.updatePaymentTransaction(transaction.id, {
        status: webhookData.status,
        transactionRef: webhookData.transactionId || webhookData.paymentRef,
        completedAt: webhookData.paidAt,
      });

      // 4. If payment successful AND user not already subscribed, activate subscription
      if (webhookData.status === 'completed' && !alreadySubscribed) {
        await this.activateSubscription(transaction.userId, transaction.planId);
      }
    }

    return {
      status: webhookData.status,
      paymentId: transaction.id,
    };
  }

  private async activateSubscription(userId: string, planId: string) {
    // CRITICAL: Re-fetch fresh subscription state to prevent concurrent double-extension
    const existingSubscription = await storage.getUserSubscription(userId);
    
    const now = Math.floor(Date.now() / 1000);
    const thirtyDays = 30 * 24 * 60 * 60; // 30 days in seconds

    if (existingSubscription) {
      // Check if user already has active subscription - idempotency guard
      const isActive = existingSubscription.status === 'active' && 
                      existingSubscription.endDate && 
                      existingSubscription.endDate > now;
      
      if (isActive) {
        // User already has active subscription - don't extend again
        // This prevents concurrent webhook/verify calls from double-extending
        return;
      }
      
      // Extend existing subscription by 30 days from the later of: current end date OR now
      const baseDate = existingSubscription.endDate 
        ? Math.max(existingSubscription.endDate, now)
        : now;
      const newEndDate = baseDate + thirtyDays;
      
      await storage.updateUserSubscription(existingSubscription.id, {
        status: 'active',
        endDate: newEndDate,
      });
    } else {
      // Create new subscription (startDate is auto-generated by database)
      await storage.createUserSubscription({
        userId,
        planId,
        status: 'active',
        endDate: now + thirtyDays,
      });
    }
  }

  private async findTransactionByProviderRef(providerRef: string) {
    // Look up transaction by transactionRef (the payment provider's reference)
    return await storage.getPaymentTransactionByRef(providerRef);
  }
}
