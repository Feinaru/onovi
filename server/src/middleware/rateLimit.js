// Rate limiters for sensitive auth endpoints.
//
// Kept intentionally narrow: only login and register are protected here so
// normal app usage (including GET /auth/me) is never throttled.

const rateLimit = require('express-rate-limit');

const TOO_MANY_ATTEMPTS = { message: 'Too many attempts. Please try again later.' };

function toInt(value, fallback) {
  const parsed = Number.parseInt(value, 10);
  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback;
}

// Login: stricter — 10 attempts per 15 minutes per IP.
const loginLimiter = rateLimit({
  windowMs: toInt(process.env.LOGIN_RATE_LIMIT_WINDOW_MS, 15 * 60 * 1000),
  max: toInt(process.env.LOGIN_RATE_LIMIT_MAX, 10),
  standardHeaders: true,
  legacyHeaders: false,
  message: TOO_MANY_ATTEMPTS
});

// Register: moderate — 20 attempts per hour per IP.
const registerLimiter = rateLimit({
  windowMs: toInt(process.env.REGISTER_RATE_LIMIT_WINDOW_MS, 60 * 60 * 1000),
  max: toInt(process.env.REGISTER_RATE_LIMIT_MAX, 20),
  standardHeaders: true,
  legacyHeaders: false,
  message: TOO_MANY_ATTEMPTS
});

module.exports = { loginLimiter, registerLimiter };
