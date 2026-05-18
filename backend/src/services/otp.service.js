const store = new Map();

const OTP_TTL = 600; // 10 minutes
const MAX_ATTEMPTS = 3;

const _set = (key, value, ttlSeconds) => {
  store.set(key, { value, expiresAt: Date.now() + ttlSeconds * 1000 });
};

const _get = (key) => {
  const item = store.get(key);
  if (!item) return null;
  if (item.expiresAt < Date.now()) { store.delete(key); return null; }
  return item.value;
};

const generateOtp = (email, prefix) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  _set(`${prefix}:${email}`, otp, OTP_TTL);
  return otp;
};

const verifyOtp = (email, otp, prefix) => {
  return _get(`${prefix}:${email}`) === otp;
};

const deleteOtp = (email, prefix) => {
  store.delete(`${prefix}:${email}`);
};

const incrementAttempts = (email, prefix) => {
  const key = `${prefix}_attempts:${email}`;
  const current = parseInt(_get(key)) || 0;
  const next = current + 1;
  _set(key, String(next), OTP_TTL);
  return next;
};

const lockOtp = (email, prefix, seconds) => {
  _set(`${prefix}_lock:${email}`, '1', seconds);
};

const isLocked = (email, prefix) => {
  return _get(`${prefix}_lock:${email}`) !== null;
};

module.exports = { generateOtp, verifyOtp, deleteOtp, incrementAttempts, lockOtp, isLocked, MAX_ATTEMPTS };
