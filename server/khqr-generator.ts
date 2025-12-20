import { KHQR, CURRENCY, TAG } from "ts-khqr";

interface KHQRPaymentData {
  amount: number;
  currency: "USD" | "KHR";
  transactionId: string;
}

export function generateKHQRForPayment(
  amount: number,
  currency: "USD" | "KHR",
  transactionId: string
): { qrString: string; md5Hash: string } {
  const bakongId = process.env.BAKONG_ID || "cham_toem2@aclb";
  const merchantName = process.env.MERCHANT_NAME || "RUENG Movies";
  const merchantCity = process.env.MERCHANT_CITY || "Phnom Penh";

  const result = KHQR.generate({
    tag: TAG.INDIVIDUAL,
    accountID: bakongId,
    merchantName: merchantName,
    merchantCity: merchantCity,
    currency: currency === "USD" ? CURRENCY.USD : CURRENCY.KHR,
    amount: amount,
    expirationTimestamp: Date.now() + 10 * 60 * 1000,
    additionalData: {
      billNumber: transactionId,
      storeLabel: "RUENG",
      terminalLabel: "WEB",
      purposeOfTransaction: "Movie Purchase",
    },
  });

  if (result.status.code !== 0) {
    console.error("[KHQR] Generation failed:", result.status);
    throw new Error(`KHQR generation failed: ${result.status.message}`);
  }

  console.log(`[KHQR] Generated valid KHQR for ${bakongId}, amount: ${currency} ${amount}`);
  console.log(`[KHQR] QR String: ${result.data?.qr?.substring(0, 50)}...`);
  
  return {
    qrString: result.data!.qr,
    md5Hash: result.data!.md5,
  };
}
