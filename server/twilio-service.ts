import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const verifyServiceSid = process.env.TWILIO_VERIFY_SERVICE_SID;

let client: twilio.Twilio | null = null;

function getClient(): twilio.Twilio {
  if (!client) {
    if (!accountSid || !authToken) {
      throw new Error("Twilio credentials not configured");
    }
    client = twilio(accountSid, authToken);
  }
  return client;
}

export const twilioService = {
  async sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; error?: string }> {
    try {
      if (!verifyServiceSid) {
        throw new Error("Twilio Verify Service SID not configured");
      }

      const twilioClient = getClient();
      const verification = await twilioClient.verify.v2
        .services(verifyServiceSid)
        .verifications.create({
          to: phoneNumber,
          channel: "sms",
        });

      console.log(`[Twilio] Verification sent to ${phoneNumber}, status: ${verification.status}`);
      return { success: true };
    } catch (error: any) {
      console.error("[Twilio] Error sending verification:", error.message);
      return { success: false, error: error.message };
    }
  },

  async verifyCode(phoneNumber: string, code: string): Promise<{ success: boolean; valid: boolean; error?: string }> {
    try {
      if (!verifyServiceSid) {
        throw new Error("Twilio Verify Service SID not configured");
      }

      const twilioClient = getClient();
      const verificationCheck = await twilioClient.verify.v2
        .services(verifyServiceSid)
        .verificationChecks.create({
          to: phoneNumber,
          code: code,
        });

      console.log(`[Twilio] Verification check for ${phoneNumber}, status: ${verificationCheck.status}`);
      return { 
        success: true, 
        valid: verificationCheck.status === "approved" 
      };
    } catch (error: any) {
      console.error("[Twilio] Error verifying code:", error.message);
      return { success: false, valid: false, error: error.message };
    }
  },

  isConfigured(): boolean {
    return !!(accountSid && authToken && verifyServiceSid);
  }
};
