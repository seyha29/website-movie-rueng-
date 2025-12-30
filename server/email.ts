import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendOTPEmail(
  to: string,
  otp: string,
  fullName: string,
  language: "km" | "en" = "en"
): Promise<boolean> {
  const subject = language === "km" 
    ? "លេខកូដផ្ទៀងផ្ទាត់ - Rueng" 
    : "Rueng - Verification Code";

  const htmlContent = language === "km" 
    ? `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">RUENG</h1>
        </div>
        <div style="background: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px; color: #fff;">
          <p style="font-size: 16px;">សួស្តី ${fullName},</p>
          <p style="font-size: 16px;">លេខកូដផ្ទៀងផ្ទាត់របស់អ្នកគឺ:</p>
          <div style="background: #2d2d2d; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #888;">លេខកូដនេះនឹងផុតកំណត់ក្នុងរយៈពេល 10 នាទី។</p>
          <p style="font-size: 14px; color: #888;">ប្រសិនបើអ្នកមិនបានស្នើសុំលេខកូដនេះទេ សូមព្រងើយកម្រណីអ៊ីមែលនេះ។</p>
        </div>
      </div>
    `
    : `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #f97316, #ea580c); padding: 20px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0; text-align: center;">RUENG</h1>
        </div>
        <div style="background: #1a1a1a; padding: 30px; border-radius: 0 0 10px 10px; color: #fff;">
          <p style="font-size: 16px;">Hello ${fullName},</p>
          <p style="font-size: 16px;">Your verification code is:</p>
          <div style="background: #2d2d2d; padding: 20px; border-radius: 8px; text-align: center; margin: 20px 0;">
            <span style="font-size: 32px; font-weight: bold; color: #f97316; letter-spacing: 8px;">${otp}</span>
          </div>
          <p style="font-size: 14px; color: #888;">This code will expire in 10 minutes.</p>
          <p style="font-size: 14px; color: #888;">If you didn't request this code, please ignore this email.</p>
        </div>
      </div>
    `;

  try {
    await transporter.sendMail({
      from: `"Rueng" <${process.env.EMAIL_USER}>`,
      to,
      subject,
      html: htmlContent,
    });
    console.log(`OTP email sent to ${to}`);
    return true;
  } catch (error) {
    console.error("Failed to send OTP email:", error);
    return false;
  }
}
