const cron = require('node-cron');
const Subscription = require('../models/Subscription');

cron.schedule('*/5 * * * *', async () => {
  try {
    const result = await Subscription.updateMany(
      { status: 'active', endDate: { $lt: new Date() } },
      { $set: { status: 'expired' } }
    );
    if (result.modifiedCount > 0) {
      console.log(`Expired ${result.modifiedCount} subscriptions`);
    }
  } catch (err) {
    console.error('Scheduler error:', err.message);
  }
});
