// Rate Limiter tracking ONLY failed PIN attempts
const failedAttempts = new Map();
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes
const MAX_FAILED = 25;

const checkPinRateLimit = (req, res, next) => {
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown-ip';
  const now = Date.now();

  const record = failedAttempts.get(ip);
  if (record) {
    if (now - record.firstAttempt > WINDOW_MS) {
      failedAttempts.delete(ip);
    } else if (record.count >= MAX_FAILED) {
      const retryAfter = Math.ceil((WINDOW_MS - (now - record.firstAttempt)) / 1000);
      return res.status(429).json({
        error: `Too many incorrect PIN attempts. Please wait ${retryAfter} seconds before trying again.`
      });
    }
  }
  next();
};

const recordFailedAttempt = (ip) => {
  const now = Date.now();
  const record = failedAttempts.get(ip) || { count: 0, firstAttempt: now };
  if (now - record.firstAttempt > WINDOW_MS) {
    record.count = 1;
    record.firstAttempt = now;
  } else {
    record.count++;
  }
  failedAttempts.set(ip, record);
};

const clearFailedAttempts = (ip) => {
  failedAttempts.delete(ip);
};

module.exports = {
  checkPinRateLimit,
  recordFailedAttempt,
  clearFailedAttempts
};
