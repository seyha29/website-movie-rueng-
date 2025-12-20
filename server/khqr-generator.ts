import crypto from "crypto";

interface KHQRData {
  bakongId: string;
  merchantName: string;
  merchantCity: string;
  amount: number;
  currency: "USD" | "KHR";
  billNumber?: string;
  storeLabel?: string;
  terminalLabel?: string;
}

export function generateKHQRString(data: KHQRData): string {
  const fields: string[] = [];
  
  const addField = (id: string, value: string) => {
    const length = value.length.toString().padStart(2, "0");
    fields.push(`${id}${length}${value}`);
  };
  
  addField("00", "01");
  
  const merchantAccountInfo = buildMerchantAccountInfo(data.bakongId);
  addField("29", merchantAccountInfo);
  
  addField("52", "5999");
  
  addField("53", data.currency === "USD" ? "840" : "116");
  
  if (data.amount > 0) {
    const amountStr = data.amount.toFixed(2);
    addField("54", amountStr);
  }
  
  addField("58", "KH");
  
  addField("59", data.merchantName.substring(0, 25));
  
  addField("60", data.merchantCity.substring(0, 15));
  
  const additionalData = buildAdditionalData(data);
  if (additionalData) {
    addField("62", additionalData);
  }
  
  const qrWithoutCRC = fields.join("") + "6304";
  const crc = calculateCRC16(qrWithoutCRC);
  
  return qrWithoutCRC + crc;
}

function buildMerchantAccountInfo(bakongId: string): string {
  const subFields: string[] = [];
  
  const addSubField = (id: string, value: string) => {
    const length = value.length.toString().padStart(2, "0");
    subFields.push(`${id}${length}${value}`);
  };
  
  addSubField("00", "bakong");
  addSubField("01", bakongId);
  
  return subFields.join("");
}

function buildAdditionalData(data: KHQRData): string {
  const subFields: string[] = [];
  
  const addSubField = (id: string, value: string) => {
    const length = value.length.toString().padStart(2, "0");
    subFields.push(`${id}${length}${value}`);
  };
  
  if (data.billNumber) {
    addSubField("01", data.billNumber.substring(0, 25));
  }
  
  if (data.storeLabel) {
    addSubField("03", data.storeLabel.substring(0, 25));
  }
  
  if (data.terminalLabel) {
    addSubField("07", data.terminalLabel.substring(0, 25));
  }
  
  return subFields.join("");
}

function calculateCRC16(data: string): string {
  let crc = 0xFFFF;
  const polynomial = 0x1021;
  
  for (let i = 0; i < data.length; i++) {
    crc ^= data.charCodeAt(i) << 8;
    for (let j = 0; j < 8; j++) {
      if (crc & 0x8000) {
        crc = (crc << 1) ^ polynomial;
      } else {
        crc = crc << 1;
      }
      crc &= 0xFFFF;
    }
  }
  
  return crc.toString(16).toUpperCase().padStart(4, "0");
}

export function generateKHQRForPayment(
  amount: number,
  currency: "USD" | "KHR",
  transactionId: string
): { qrString: string; md5Hash: string } {
  const bakongId = process.env.BAKONG_ID || "cham_toem2@aclb";
  const merchantName = process.env.MERCHANT_NAME || "RUENG Movies";
  const merchantCity = process.env.MERCHANT_CITY || "Phnom Penh";
  
  const qrString = generateKHQRString({
    bakongId,
    merchantName,
    merchantCity,
    amount,
    currency,
    billNumber: transactionId,
    storeLabel: "RUENG",
    terminalLabel: "WEB",
  });
  
  const md5Hash = crypto.createHash("md5").update(qrString).digest("hex");
  
  return { qrString, md5Hash };
}
