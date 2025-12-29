import crypto from 'crypto';
import bcrypt from 'bcrypt';

const MOCEAN_API_TOKEN = process.env.MOCEAN_API_TOKEN;
const SMS_SENDER = process.env.SMS_SENDER || 'RUENG';
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
  if (!MOCEAN_API_TOKEN) {
    console.error('[SMS] MoceanAPI token not configured');
    return { success: false, error: 'SMS service not configured' };
  }

  try {
    const formattedPhone = phoneNumber.replace('+', '');
    
    const requestBody = {
      'mocean-from': SMS_SENDER,
      'mocean-to': formattedPhone,
      'mocean-text': message,
    };

    console.log(`[SMS] Sending to ${formattedPhone}: ${message.substring(0, 50)}...`);

    const response = await fetch('https://rest.moceanapi.com/rest/2/sms', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${MOCEAN_API_TOKEN}`,
      },
      body: JSON.stringify(requestBody),
    });

    const responseText = await response.text();
    console.log(`[SMS] API Response: ${responseText.substring(0, 300)}`);
    
    let result;
    try {
      result = JSON.parse(responseText);
    } catch {
      console.error(`[SMS] Invalid response format: ${responseText.substring(0, 200)}`);
      return { success: false, error: 'Invalid API response format' };
    }
    
    if (response.ok && result.messages && result.messages[0]?.status === '0') {
      console.log(`[SMS] Sent successfully to ${formattedPhone}`);
      return { success: true, messageId: result.messages[0]['msgid'] };
    } else {
      const errorMsg = result['err_msg'] || result.messages?.[0]?.['err_msg'] || 'Unknown error';
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
