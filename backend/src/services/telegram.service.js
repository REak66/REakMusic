const axios = require('axios');

const BASE_URL = () => `https://api.telegram.org/bot${process.env.TELEGRAM_BOT_TOKEN}`;

const notifyAdmin = async (message, extra = {}) => {
  if (!process.env.TELEGRAM_BOT_TOKEN || !process.env.TELEGRAM_ADMIN_CHAT_ID) return;
  try {
    await axios.post(`${BASE_URL()}/sendMessage`, {
      chat_id: process.env.TELEGRAM_ADMIN_CHAT_ID,
      text: message,
      parse_mode: 'HTML',
      ...extra,
    });
  } catch (err) {
    console.error('Telegram notify error:', err.message);
  }
};

const notifySubscriptionRequest = async (subscription, user) => {
  const planLabel = subscription.plan.charAt(0).toUpperCase() + subscription.plan.slice(1);
  const message =
    `🔔 <b>New Subscription Request</b>\n\n` +
    `👤 User: <b>${user?.fullName || 'N/A'}</b>\n` +
    `📧 Email: ${user?.email || 'N/A'}\n` +
    `📋 Plan: <b>${planLabel}</b>\n` +
    `💰 Price: <b>$${subscription.price.toFixed(2)}</b>\n` +
    `🕐 Requested: ${new Date().toLocaleString()}`;

  await notifyAdmin(message, {
    reply_markup: {
      inline_keyboard: [[
        { text: '✅ Approve', callback_data: `sub_approve_${subscription._id}` },
        { text: '❌ Reject', callback_data: `sub_reject_${subscription._id}` },
      ]],
    },
  });
};

const answerCallbackQuery = async (callbackQueryId, text) => {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    await axios.post(`${BASE_URL()}/answerCallbackQuery`, {
      callback_query_id: callbackQueryId,
      text,
      show_alert: false,
    });
  } catch (err) {
    console.error('Telegram answerCallback error:', err.message);
  }
};

const editMessageText = async (chatId, messageId, text) => {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    await axios.post(`${BASE_URL()}/editMessageText`, {
      chat_id: chatId,
      message_id: messageId,
      text,
      parse_mode: 'HTML',
    });
  } catch (err) {
    console.error('Telegram editMessage error:', err.message);
  }
};

// ── Polling (for local dev — no public URL needed) ──────────────────────────
let _pollOffset = 0;
let _pollTimer = null;

const _processCallbackQuery = async (callbackQuery) => {
  const { id: callbackQueryId, data: callbackData, message, from } = callbackQuery;
  if (!callbackData || !callbackData.startsWith('sub_')) return;

  const parts = callbackData.split('_'); // ['sub', 'approve'|'reject', <id>]
  if (parts.length !== 3) return;

  const [, action, subId] = parts;
  if (!['approve', 'reject'].includes(action)) return;

  // Lazy-require to avoid circular deps at module load time
  const Subscription = require('../models/Subscription');
  const PLAN_DAYS = { weekly: 7, monthly: 30 };

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
    console.error('Telegram poll process error:', err.message);
    await answerCallbackQuery(callbackQueryId, 'Error processing request.').catch(() => {});
  }
};

const _poll = async () => {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  try {
    const { data } = await axios.get(`${BASE_URL()}/getUpdates`, {
      params: { offset: _pollOffset, timeout: 30, allowed_updates: JSON.stringify(['callback_query']) },
      timeout: 35000,
    });
    for (const update of data.result || []) {
      _pollOffset = update.update_id + 1;
      if (update.callback_query) {
        await _processCallbackQuery(update.callback_query);
      }
    }
  } catch (err) {
    if (err.code !== 'ECONNABORTED') console.error('Telegram poll error:', err.message);
  } finally {
    _pollTimer = setTimeout(_poll, 1000);
  }
};

const startPolling = async () => {
  if (!process.env.TELEGRAM_BOT_TOKEN) return;
  // Clear any existing webhook so polling works
  try {
    await axios.post(`${BASE_URL()}/deleteWebhook`, { drop_pending_updates: false });
    console.log('Telegram: webhook cleared, polling started');
  } catch (err) {
    console.error('Telegram: failed to clear webhook:', err.message);
  }
  _poll();
};

const stopPolling = () => {
  if (_pollTimer) { clearTimeout(_pollTimer); _pollTimer = null; }
};

module.exports = { notifyAdmin, notifySubscriptionRequest, answerCallbackQuery, editMessageText, startPolling, stopPolling };

