import crypto from 'crypto';
import bcrypt from 'bcrypt';

const TWILIO_ACCOUNT_SID = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_AUTH_TOKEN = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_PHONE_NUMBER = process.env.TWILIO_PHONE_NUMBER;
const OTP_EXPIRE_MINUTES = parseInt(process.env.OTP_EXPIRE_MINUTES || '5', 10);

interface SendSMSResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

export function generateOTP(): string {
  return crypto.randomInt(100000, 999999).toString();
}

export async function hashOTP(otp: string): Promise<string> {
  return bcrypt.hash(otp, 10);
}

export function getOTPExpiryTime(): number {
  return Math.floor(Date.now() / 1000) + (OTP_EXPIRE_MINUTES * 60);
}

export function isOTPExpired(expiresAt: number): boolean {
  return Math.floor(Date.now() / 1000) > expiresAt;
}

export async function verifyOTP(otp: string, storedHash: string): Promise<boolean> {
  return bcrypt.compare(otp, storedHash);
}

export async function sendSMS(phoneNumber: string, message: string): Promise<SendSMSResult> {
  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_PHONE_NUMBER) {
    console.error('[SMS] Twilio credentials not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const formattedPhone = phoneNumber.startsWith('+') ? phoneNumber : `+${phoneNumber}`;
    
    console.log(`[SMS] Sending to ${formattedPhone}: ${message.substring(0, 50)}...`);

    const url = `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`;
    
    const authHeader = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString('base64');
    
    const body = new URLSearchParams({
      To: formattedPhone,
      From: TWILIO_PHONE_NUMBER,
      Body: message,
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: body.toString(),
    });

    const result = await response.json();
    
    if (response.ok && result.sid) {
      console.log(`[SMS] Sent successfully to ${formattedPhone}, SID: ${result.sid}`);
      return { success: true, messageId: result.sid };
    } else {
      const errorMsg = result.message || result.error_message || 'Unknown error';
      console.error(`[SMS] Failed: ${errorMsg}`);
      return { success: false, error: errorMsg };
    }
  } catch (error) {
    console.error('[SMS] Error:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}

export async function sendOTPSMS(phoneNumber: string, otp: string): Promise<SendSMSResult> {
  const message = `Your RUENG verification code is: ${otp}. This code expires in ${OTP_EXPIRE_MINUTES} minutes. Do not share this code with anyone.`;
  return sendSMS(phoneNumber, message);
}

export const smsService = {
  generateOTP,
  hashOTP,
  getOTPExpiryTime,
  isOTPExpired,
  verifyOTP,
  sendSMS,
  sendOTPSMS,
};
