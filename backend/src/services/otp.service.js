const redisClient = require('../config/redis');

const OTP_TTL = 600; // 10 minutes
const MAX_ATTEMPTS = 3;

const generateOtp = async (email, prefix) => {
  const otp = Math.floor(100000 + Math.random() * 900000).toString();
  await redisClient.set(`${prefix}:${email}`, otp, { EX: OTP_TTL });
  return otp;
};

const verifyOtp = async (email, otp, prefix) => {
  const stored = await redisClient.get(`${prefix}:${email}`);
  return stored === otp;
};

const deleteOtp = async (email, prefix) => {
  await redisClient.del(`${prefix}:${email}`);
};

const incrementAttempts = async (email, prefix) => {
  const key = `${prefix}_attempts:${email}`;
  const attempts = await redisClient.incr(key);
  await redisClient.expire(key, OTP_TTL);
  return attempts;
};

const lockOtp = async (email, prefix, seconds) => {
  await redisClient.set(`${prefix}_lock:${email}`, '1', { EX: seconds });
};

const isLocked = async (email, prefix) => {
  const lock = await redisClient.get(`${prefix}_lock:${email}`);
  return lock !== null;
};

module.exports = { generateOtp, verifyOtp, deleteOtp, incrementAttempts, lockOtp, isLocked, MAX_ATTEMPTS };
