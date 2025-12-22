import crypto from "crypto";
import querystring from "querystring";
import { KHQR, TAG, CURRENCY, COUNTRY } from "ts-khqr";

export interface PaymentInitiationResponse {
  paymentRef: string;
  checkoutUrl?: string;
  khqrString?: string;
  formData?: Record<string, string>;
  sessionId?: string;
  expiresAt?: number;
}

export interface PaymentVerificationResponse {
  paymentRef: string;
  status: 'pending' | 'completed' | 'failed' | 'cancelled';
  amount: number;
  currency: string;
  transactionId?: string;
  paidAt?: number;
}

export interface PaymentProvider {
  initiatePayment(params: {
    userId: string;
    planId: string;
    amount: number;
    currency: string;
    callbackUrl: string;
  }): Promise<PaymentInitiationResponse>;

  verifyPayment(paymentRef: string): Promise<PaymentVerificationResponse>;

  parseWebhook(body: any, signature: string): Promise<PaymentVerificationResponse>;
}

// Mock provider for development - simulates RaksemeyPay API
export class MockRaksmeyPayProvider implements PaymentProvider {
  private payments: Map<string, PaymentVerificationResponse> = new Map();

  async initiatePayment(params: {
    userId: string;
    planId: string;
    amount: number;
    currency: string;
    callbackUrl: string;
  }): Promise<PaymentInitiationResponse> {
    const paymentRef = `MOCK_${crypto.randomBytes(8).toString('hex')}`;
    
    // Store pending payment
    this.payments.set(paymentRef, {
      paymentRef,
      status: 'pending',
      amount: params.amount,
      currency: params.currency,
    });

    // For mock payments, don't return a checkoutUrl
    // This triggers the frontend to auto-complete the payment
    return {
      paymentRef,
      // No checkoutUrl for mock - triggers auto-complete flow
      sessionId: `SESSION_${paymentRef}`,
      expiresAt: Math.floor(Date.now() / 1000) + 1800, // 30 minutes
    };
  }

  async verifyPayment(paymentRef: string): Promise<PaymentVerificationResponse> {
    const payment = this.payments.get(paymentRef);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    return payment;
  }

  async parseWebhook(body: any, signature: string): Promise<PaymentVerificationResponse> {
    // In real RaksemeyPay, verify HMAC signature here
    const expectedSignature = this.generateMockSignature(body);
    
    if (signature !== expectedSignature) {
      throw new Error('Invalid webhook signature');
    }

    const paymentRef = body.paymentRef;
    const payment = this.payments.get(paymentRef);
    
    if (!payment) {
      throw new Error('Payment not found');
    }

    // Update payment status based on webhook
    payment.status = body.status;
    payment.transactionId = body.transactionId;
    payment.paidAt = body.paidAt || Math.floor(Date.now() / 1000);

    return payment;
  }

  // Mock method to simulate payment success (for testing)
  simulatePaymentSuccess(paymentRef: string): void {
    const payment = this.payments.get(paymentRef);
    if (payment) {
      payment.status = 'completed';
      payment.transactionId = `TXN_${crypto.randomBytes(8).toString('hex')}`;
      payment.paidAt = Math.floor(Date.now() / 1000);
    }
  }

  // Mock method to simulate payment failure (for testing)
  simulatePaymentFailure(paymentRef: string): void {
    const payment = this.payments.get(paymentRef);
    if (payment) {
      payment.status = 'failed';
    }
  }

  private generateMockSignature(body: any): string {
    const secret = process.env.RAKSMEYPAY_PROFILE_KEY || 'mock-secret';
    return crypto.createHmac('sha256', secret).update(JSON.stringify(body)).digest('hex');
  }
}

// Real Bakong KHQR provider - Generates proper KHQR codes for banking apps
export class RealRaksmeyPayProvider implements PaymentProvider {
  private merchantId: string;
  private profileKey: string;
  private bakongAccountId: string;
  private merchantName: string;
  private paymentBaseUrl: string;

  constructor() {
    this.merchantId = process.env.RAKSMEYPAY_PROFILE_ID || '';
    this.profileKey = process.env.RAKSMEYPAY_PROFILE_KEY || '';
    this.bakongAccountId = process.env.BAKONG_ACCOUNT_ID || '';
    this.merchantName = process.env.BAKONG_MERCHANT_NAME || 'RUENG Movies';
    this.paymentBaseUrl = `https://raksmeypay.com/payment/request/${this.merchantId}`;

    if (!this.merchantId || !this.profileKey) {
      throw new Error('RaksemeyPay credentials not configured. Set RAKSMEYPAY_PROFILE_ID and RAKSMEYPAY_PROFILE_KEY');
    }
    
    if (!this.bakongAccountId) {
      throw new Error('Bakong Account ID not configured. Set BAKONG_ACCOUNT_ID');
    }
  }

  async initiatePayment(params: {
    userId: string;
    planId: string;
    amount: number;
    currency: string;
    callbackUrl: string;
  }): Promise<PaymentInitiationResponse> {
    const transactionId = Date.now();
    
    // Generate hash for RaksmeyPay: SHA1(profileKey + amount + transaction_id)
    const hash = crypto.createHash('sha1')
      .update(`${this.profileKey}${params.amount}${transactionId}`)
      .digest('hex');
    
    // Build RaksmeyPay checkout URL for verification (backup)
    const checkoutParams = new URLSearchParams({
      amount: params.amount.toString(),
      transaction_id: transactionId.toString(),
      return_url: params.callbackUrl,
      hash: hash,
    });
    
    const checkoutUrl = `${this.paymentBaseUrl}?${checkoutParams.toString()}`;
    
    // Generate proper Bakong KHQR code that banking apps can scan
    let khqrString: string | undefined;
    
    try {
      const khqrResult = KHQR.generate({
        tag: TAG.INDIVIDUAL,
        accountID: this.bakongAccountId,
        merchantName: this.merchantName,
        merchantCity: 'Phnom Penh',
        currency: params.currency === 'USD' ? CURRENCY.USD : CURRENCY.KHR,
        amount: params.amount,
        countryCode: COUNTRY.KH,
        additionalData: {
          billNumber: transactionId.toString(),
          mobileNumber: '',
          storeLabel: 'RUENG Movies',
          terminalLabel: `TXN${transactionId}`,
        },
      });
      
      // Access the KHQR string from result.data.qr
      if (khqrResult && khqrResult.data && khqrResult.data.qr) {
        khqrString = khqrResult.data.qr;
        console.log(`[KHQR] Generated valid Bakong KHQR for transaction ${transactionId}`);
      } else {
        console.error('[KHQR] Failed to generate KHQR - unexpected result structure:', khqrResult);
      }
    } catch (error) {
      console.error('[KHQR] Failed to generate KHQR code:', error);
    }
    
    console.log(`[RaksmeyPay] Created payment for user ${params.userId}:`, {
      transaction_id: transactionId,
      amount: params.amount,
      currency: params.currency,
      hasKhqr: !!khqrString,
    });
    
    return {
      paymentRef: transactionId.toString(),
      khqrString: khqrString, // Return KHQR for QR display
      checkoutUrl: khqrString ? undefined : checkoutUrl, // Only use URL if KHQR fails
      sessionId: transactionId.toString(),
      expiresAt: Math.floor(Date.now() / 1000) + 600, // 10 minutes
    };
  }

  async verifyPayment(paymentRef: string): Promise<PaymentVerificationResponse> {
    // Call RaksemeyPay's verification API to check payment status
    // Based on official RaksemeyPay PHP verification example
    
    try {
      // Generate hash for verification: SHA1(profileKey + transaction_id)
      const hash = crypto.createHash('sha1')
        .update(`${this.profileKey}${paymentRef}`)
        .digest('hex');
      
      // Verification API endpoint
      const verifyUrl = `https://raksmeypay.com/api/payment/verify/${this.merchantId}`;
      
      // Prepare POST data
      const formData = new URLSearchParams({
        transaction_id: paymentRef,
        hash: hash,
      });
      
      console.log(`[RaksemeyPay] Verifying payment ${paymentRef}...`);
      
      // Make API call (exactly like the example)
      const response = await fetch(verifyUrl, {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        console.error(`[RaksemeyPay] Verification API returned status ${response.status}`);
        throw new Error(`Verification API error: ${response.status}`);
      }
      
      const data = await response.json();
      
      console.log(`[RaksemeyPay] Verification response:`, data);
      
      // Parse response based on RaksemeyPay API spec
      // Note: status === 0 can happen transiently (eventual consistency), don't treat as hard failure
      if (data.status === 0) {
        // Payment not found in API - this might be temporary
        console.warn(`[RaksemeyPay] Payment not found in API (may be eventual consistency): ${paymentRef}`);
        return {
          paymentRef,
          status: 'pending', // Treat as pending, not failed
          amount: 0,
          currency: 'USD',
        };
      }
      
      // Validate expected response shape
      if (!data.payment_status) {
        console.warn(`[RaksemeyPay] Unexpected API response shape for ${paymentRef}:`, data);
        return {
          paymentRef,
          status: 'pending', // Unknown shape - treat as pending
          amount: 0,
          currency: 'USD',
        };
      }
      
      // Map RaksemeyPay status to our status
      let status: 'pending' | 'completed' | 'failed' | 'cancelled' = 'pending';
      const paymentStatus = String(data.payment_status).toUpperCase();
      
      if (paymentStatus === 'SUCCESS') {
        status = 'completed';
      } else if (paymentStatus === 'PENDING') {
        status = 'pending';
      } else if (paymentStatus === 'FAILED' || paymentStatus === 'CANCELLED') {
        status = 'failed';
      } else {
        // Unknown status - log and treat as pending
        console.warn(`[RaksemeyPay] Unknown payment_status: ${data.payment_status} for ${paymentRef}`);
        status = 'pending';
      }
      
      return {
        paymentRef,
        status,
        amount: parseFloat(data.payment_amount) || 0,
        currency: 'USD',
        transactionId: paymentRef,
        paidAt: status === 'completed' ? Math.floor(Date.now() / 1000) : undefined,
      };
      
    } catch (error) {
      console.error(`[RaksemeyPay] Verification failed for ${paymentRef}:`, error);
      // Return pending status on error - don't fail the request
      return {
        paymentRef,
        status: 'pending',
        amount: 0,
        currency: 'USD',
      };
    }
  }

  async parseWebhook(body: any, signature: string): Promise<PaymentVerificationResponse> {
    // RaksemeyPay uses redirect-based flow, not webhooks
    // This method is for future webhook support if RaksemeyPay adds it
    throw new Error('RaksemeyPay does not support webhooks - uses redirect-based flow');
  }

  // Validate callback from RaksemeyPay success redirect
  // Based on official RaksemeyPay PHP validation example
  validateCallback(params: {
    success_time: string;
    success_amount: string;
    bakong_hash: string;
    success_hash: string;
    transaction_id: string;
  }): { isValid: boolean; paymentRef: string; errorMessage?: string } {
    const { success_time, success_amount, bakong_hash, success_hash, transaction_id } = params;
    
    // Validate required parameters
    if (!success_time || !success_amount || !bakong_hash || !success_hash || !transaction_id) {
      console.error('[RaksemeyPay] Missing required callback parameters');
      return { 
        isValid: false, 
        paymentRef: transaction_id || 'unknown',
        errorMessage: 'Missing required parameters'
      };
    }
    
    // Validate token expiration (180 seconds as per RaksemeyPay spec)
    const currentTime = Math.floor(Date.now() / 1000);
    const successTime = parseInt(success_time, 10);
    
    if (isNaN(successTime) || (currentTime - successTime) > 180) {
      console.error('[RaksemeyPay] Token expired. Success time:', success_time, 'Current time:', currentTime);
      return { 
        isValid: false, 
        paymentRef: transaction_id,
        errorMessage: 'Token expired (>180 seconds)'
      };
    }
    
    // Reconstruct hash to verify callback authenticity
    // Format: SHA1(profileKey + success_time + success_amount + bakong_hash + transaction_id)
    const b4hash = `${this.profileKey}${success_time}${success_amount}${bakong_hash}${transaction_id}`;
    const expectedHash = crypto.createHash('sha1').update(b4hash).digest('hex');
    
    const isValid = success_hash === expectedHash;
    
    if (!isValid) {
      console.error('[RaksemeyPay] Hash validation failed for transaction:', transaction_id);
      console.error('Expected hash:', expectedHash);
      console.error('Received hash:', success_hash);
      console.error('Hash input:', b4hash);
      return {
        isValid: false,
        paymentRef: transaction_id,
        errorMessage: 'Invalid hash signature'
      };
    }
    
    console.log(`[RaksemeyPay] Callback validated successfully for ${transaction_id}`);
    
    return {
      isValid: true,
      paymentRef: transaction_id,
    };
  }
}

// Factory: Automatically select provider based on environment configuration
// SECURITY: Decision is based on presence of RaksemeyPay credentials (build-time/deployment config)
// This prevents runtime manipulation - if credentials exist, real provider MUST be used
export function createPaymentProvider(): PaymentProvider {
  const hasRaksmeyPayCredentials = Boolean(
    process.env.RAKSMEYPAY_PROFILE_ID && 
    process.env.RAKSMEYPAY_PROFILE_KEY
  );
  
  if (hasRaksmeyPayCredentials) {
    console.log('[Payment] Using RealRaksmeyPayProvider (credentials configured)');
    return new RealRaksmeyPayProvider();
  } else {
    console.log('[Payment] Using MockRaksmeyPayProvider (no credentials - development mode)');
    return new MockRaksmeyPayProvider();
  }
}
