/**
 * Shared helpers for the Vercel API functions.
 *
 * Keeps cross-cutting concerns (security headers, JSON responses, CORS
 * allowlist) in one place so every handler stays a page of readable logic.
 */

const ALLOWED_ORIGINS = (process.env.ALLOWED_ORIGINS ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())
  .filter(Boolean);

const SECURITY_HEADERS = {
  'X-Content-Type-Options': 'nosniff',
  'Referrer-Policy': 'no-referrer',
  'Cache-Control': 'no-store',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

export function withHeaders(res, extra = {}) {
  for (const [k, v] of Object.entries({ ...SECURITY_HEADERS, ...extra })) {
    res.setHeader(k, v);
  }
  return res;
}

export function applyCors(req, res) {
  const origin = req.headers.origin ?? '';
  if (ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Vary', 'Origin');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Idempotency-Key');
    res.setHeader('Access-Control-Max-Age', '600');
  }
}

export function json(res, status, body) {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.status(status).send(JSON.stringify(body));
}

export function jsonError(res, code, status) {
  json(res, status, { error: code });
}

/** Read a request body with a hard byte cap. Node/Vercel req is a stream. */
export async function readBody(req, maxBytes = 262_144) {
  const chunks = [];
  let total = 0;
  for await (const chunk of req) {
    total += chunk.length;
    if (total > maxBytes) {
      const err = new Error('body_too_large');
      err.code = 'E_TOO_LARGE';
      throw err;
    }
    chunks.push(chunk);
  }
  return Buffer.concat(chunks).toString('utf-8');
}

/** Get the caller IP from Vercel's proxy headers. Never log raw. */
export function callerIp(req) {
  const xff = req.headers['x-forwarded-for'];
  if (typeof xff === 'string') return xff.split(',')[0].trim();
  return req.socket?.remoteAddress ?? 'unknown';
}
