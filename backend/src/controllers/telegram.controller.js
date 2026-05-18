const Subscription = require('../models/Subscription');
const { answerCallbackQuery, editMessageText } = require('../services/telegram.service');

const PLAN_DAYS = { weekly: 7, monthly: 30 };

exports.handleWebhook = async (req, res) => {
  // Always respond 200 immediately so Telegram stops retrying
  res.sendStatus(200);

  const update = req.body;
  if (!update.callback_query) return;

  const { id: callbackQueryId, data: callbackData, message, from } = update.callback_query;
  if (!callbackData || !callbackData.startsWith('sub_')) return;

  const parts = callbackData.split('_'); // ['sub', 'approve'|'reject', <id>]
  if (parts.length !== 3) return;

  const [, action, subId] = parts;
  if (!['approve', 'reject'].includes(action)) return;

  try {
    if (action === 'approve') {
      const sub = await Subscription.findOne({ _id: subId, status: 'pending' });
      if (!sub) {
        await answerCallbackQuery(callbackQueryId, 'Not found or already processed.');
        return;
      }

      const startDate = new Date();
      const endDate = new Date(startDate.getTime() + PLAN_DAYS[sub.plan] * 24 * 60 * 60 * 1000);
      sub.status = 'active';
      sub.startDate = startDate;
      sub.endDate = endDate;
      await sub.save();

      await answerCallbackQuery(callbackQueryId, '✅ Subscription approved!');
      await editMessageText(
        message.chat.id,
        message.message_id,
        message.text + `\n\n✅ <b>APPROVED</b> by ${from.first_name}`
      );
    } else {
      const sub = await Subscription.findOneAndUpdate(
        { _id: subId, status: 'pending' },
        { status: 'rejected' },
        { new: true }
      );
      if (!sub) {
        await answerCallbackQuery(callbackQueryId, 'Not found or already processed.');
        return;
      }

      await answerCallbackQuery(callbackQueryId, '❌ Subscription rejected.');
      await editMessageText(
        message.chat.id,
        message.message_id,
        message.text + `\n\n❌ <b>REJECTED</b> by ${from.first_name}`
      );
    }
  } catch (err) {
    console.error('Telegram webhook error:', err.message);
    await answerCallbackQuery(callbackQueryId, 'Error processing request.').catch(() => {});
  }
};
