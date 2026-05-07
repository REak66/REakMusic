const cron = require('node-cron');
const Order = require('../models/Order');

cron.schedule('*/5 * * * *', async () => {
  try {
    const result = await Order.updateMany(
      { status: 'pending', expiresAt: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Expired ${result.modifiedCount} pending orders`);
    }
  } catch (err) {
    console.error('Scheduler error:', err.message);
  }
});
