const axios = require('axios');
const crypto = require('crypto');

const createQR = async (orderId, amount) => {
  const response = await axios.post(
    `${process.env.KHQR_API_URL}/v1/generate_qr`,
    {
      merchant_id: process.env.KHQR_MERCHANT_ID,
      order_id: orderId.toString(),
      amount,
      currency: 'USD',
    },
    {
      headers: {
        Authorization: `Bearer ${process.env.KHQR_API_KEY}`,
        'Content-Type': 'application/json',
      },
    }
  );
  return {
    qrCode: response.data.qr_code,
    ref: response.data.transaction_ref || response.data.ref,
  };
};

const verifyWebhookSignature = (payload, signature) => {
  if (!process.env.KHQR_WEBHOOK_SECRET) return false;
  const expected = crypto
    .createHmac('sha256', process.env.KHQR_WEBHOOK_SECRET)
    .update(JSON.stringify(payload))
    .digest('hex');
  return crypto.timingSafeEqual(Buffer.from(expected), Buffer.from(signature));
};

module.exports = { createQR, verifyWebhookSignature };
