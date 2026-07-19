// Centralized security configuration for JWT and CORS handling.
//
// Goals:
// - Fail fast in production when JWT_SECRET is missing or left as a known placeholder.
// - Keep local development usable (warn instead of throwing).
// - Replace wide-open CORS with an explicit, environment-driven allowlist.

const isProduction = process.env.NODE_ENV === 'production';

// Known unsafe/default JWT secrets that must never reach production.
// Includes the placeholders shipped in .env.example so a copied-but-unedited
// production config also fails fast.
const UNSAFE_JWT_SECRETS = new Set([
  'change-this-secret-in-production',
  'your-secret-key',
  'secret',
  'jwt-secret',
  'replace_me_with_strong_secret'
]);

// Stable local-only fallback so development never crashes when JWT_SECRET is
// unset. Never used in production (validation throws there first).
const DEV_FALLBACK_SECRET = 'lomea-dev-only-secret';

// Default dev origins used when no CORS_ORIGIN/ALLOWED_ORIGINS is configured.
const DEFAULT_DEV_ORIGINS = ['http://localhost:5173', 'http://127.0.0.1:5173'];

function resolveJwtSecret() {
  const secret = process.env.JWT_SECRET;

  if (isProduction) {
    if (!secret) {
      throw new Error(
        '[security] JWT_SECRET is required in production. Configure a strong, unique secret in the deployment environment.'
      );
    }
    if (UNSAFE_JWT_SECRETS.has(secret)) {
      throw new Error(
        '[security] JWT_SECRET is set to a known insecure default. Set a strong, unique secret in the production environment.'
      );
    }
    return secret;
  }

  // Development / test: keep things running, but surface risky config.
  if (!secret) {
    console.warn(
      '[security] JWT_SECRET is not set. Using an ephemeral development secret. Set JWT_SECRET in .env for stable local sessions.'
    );
    return DEV_FALLBACK_SECRET;
  }
  if (UNSAFE_JWT_SECRETS.has(secret)) {
    console.warn(
      '[security] JWT_SECRET is using a known development placeholder. This is fine locally but MUST be replaced in production.'
    );
  }
  return secret;
}

// Resolve (and validate) once at startup so misconfiguration fails fast.
const jwtSecret = resolveJwtSecret();

// Prefer JWT_EXPIRES_IN from env; keep the existing 7d default otherwise.
const jwtExpiresIn = process.env.JWT_EXPIRES_IN || '7d';

function getAllowedOrigins() {
  const raw = process.env.CORS_ORIGIN || process.env.ALLOWED_ORIGINS || '';
  const configured = raw
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);

  if (configured.length > 0) return configured;

  // No explicit allowlist configured.
  if (isProduction) {
    console.warn(
      '[security] No CORS_ORIGIN/ALLOWED_ORIGINS configured in production. Cross-origin browser requests will be blocked.'
    );
    return [];
  }
  return DEFAULT_DEV_ORIGINS;
}

const corsOptions = {
  origin(origin, callback) {
    // Requests with no Origin header (curl, server-to-server, mobile, Postman)
    // are allowed through.
    if (!origin) return callback(null, true);

    const allowedOrigins = getAllowedOrigins();
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    }

    // Deny by omitting CORS headers rather than throwing: the browser blocks the
    // response either way, but this avoids surfacing a 500 for a rejected origin.
    console.warn(`[security] Blocked CORS request from disallowed origin: ${origin}`);
    return callback(null, false);
  }
};

module.exports = {
  jwtSecret,
  jwtExpiresIn,
  corsOptions,
  getAllowedOrigins,
  isProduction
};
