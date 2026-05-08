const axios = require('axios');
const crypto = require('crypto');
const QRCode = require('qrcode');
const { BakongKHQR, khqrData, IndividualInfo } = require('bakong-khqr');

/**
 * Generate a KHQR code locally using the official NBC SDK.
 * Converts the KHQR string into a base64 PNG image for display.
 * Returns the base64 image and the MD5 hash (used to poll payment status).
 */
const createQR = async (orderId, amount) => {
  const optionalData = {
    currency: khqrData.currency.usd,
    amount,
    billNumber: orderId.toString(),
    expirationTimestamp: Date.now() + 15 * 60 * 1000,
  };

  const individualInfo = new IndividualInfo(
    process.env.KHQR_MERCHANT_ID,
    'REakMusic',
    'Phnom Penh',
    optionalData
  );

  const khqr = new BakongKHQR();
  const result = khqr.generateIndividual(individualInfo);

  if (!result || !result.data) {
    throw new Error('Failed to generate KHQR code');
  }

  const khqrString = result.data.qr;
  const md5Hash = result.data.md5;

  // Convert the raw KHQR string into a base64 PNG image for the frontend
  const base64Image = await QRCode.toDataURL(khqrString, {
    width: 300,
    margin: 2,
    color: { dark: '#000000', light: '#ffffff' },
  });

  return {
    qrCode: base64Image, // data:image/png;base64,... — usable as <img src>
    ref: md5Hash,        // MD5 used to poll transaction status
  };
};

/**
 * Check payment status via Bakong Open API.
 * Call this to verify if a customer has paid for a given QR (by its MD5).
 */
const checkPayment = async (md5Hash) => {
  const response = await axios.post(
    `${process.env.KHQR_API_URL}/v1/check_transaction_by_md5`,
    { md5: md5Hash },
    {
      headers: {
        Authorization: `Bearer ${process.env.KHQR_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return response.data;
};

/**
 * Verify a webhook signature from Bakong using HMAC-SHA256.
 */
const verifyWebhookSignature = (payload, signature) => {
  if (!process.env.KHQR_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', process.env.KHQR_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

module.exports = { createQR, checkPayment, verifyWebhookSignature };
