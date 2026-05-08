// In-memory key-value store replacing Redis
const store = new Map();

const get = (key) => {
  const item = store.get(key);
  if (!item) return null;
  if (item.expiresAt && item.expiresAt < Date.now()) {
    store.delete(key);
    return null;
  }
  return item.value;
};

const set = (key, value, options = {}) => {
  const expiresAt = options.EX ? Date.now() + options.EX * 1000 : null;
  store.set(key, { value: String(value), expiresAt });
};

const del = (key) => { store.delete(key); };

const incr = (key) => {
  const current = parseInt(get(key)) || 0;
  const newVal = current + 1;
  const existing = store.get(key);
  store.set(key, { value: String(newVal), expiresAt: existing ? existing.expiresAt : null });
  return newVal;
};

const expire = (key, seconds) => {
  const item = store.get(key);
  if (item) item.expiresAt = Date.now() + seconds * 1000;
};

const ping = () => 'PONG';

module.exports = { get, set, del, incr, expire, ping };
