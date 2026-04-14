/**
 * @file index.js — BIGMAMA$ edge router.
 *
 * Hand-rolled router (no framework — keeps the Worker under 20 KB gzipped
 * and keeps the dependency surface at zero).
 *
 * Pipeline: parse URL -> dispatch -> attach security headers -> attach CORS.
 * Every exception is caught and converted to a generic 500 so we never leak
 * stack traces over the wire.
 */

import { handleCreateReport } from './routes/reports.js';
import { handleHealth } from './routes/health.js';
import { handleCaseStatus } from './routes/case-status.js';
import { handlePreflight, withCors } from './middleware/cors.js';
import { withSecurityHeaders } from './middleware/security-headers.js';
import { json, jsonError } from './lib/response.js';

/** @type {RegExp} */
const CASE_STATUS_RE = /^\/api\/case\/([A-Za-z0-9-]+)\/status$/;

export default {
  /**
   * @param {Request} request
   * @param {Record<string, any>} env
   * @param {ExecutionContext} ctx
   * @returns {Promise<Response>}
   */
  async fetch(request, env, ctx) {
    let response;
    try {
      response = await route(request, env, ctx);
    } catch (err) {
      // Never leak error detail.
      console.log(JSON.stringify({ evt: 'unhandled', msg: safeError(err) }));
      response = jsonError('internal_error', 500);
    }
    return withCors(withSecurityHeaders(response), request, env);
  },
};

/**
 * @param {Request} request
 * @param {Record<string, any>} env
 * @param {ExecutionContext} ctx
 * @returns {Promise<Response>}
 */
async function route(request, env, ctx) {
  const { pathname } = new URL(request.url);
  const method = request.method.toUpperCase();

  if (method === 'OPTIONS') {
    return handlePreflight(request, env);
  }

  if (pathname === '/api/health' && method === 'GET') {
    return handleHealth(request, env);
  }

  if (pathname === '/api/reports' && method === 'POST') {
    return handleCreateReport(request, env, ctx);
  }

  const caseMatch = pathname.match(CASE_STATUS_RE);
  if (caseMatch && method === 'GET') {
    return handleCaseStatus(request, env, caseMatch[1]);
  }

  // Wrong method on known path -> 405; otherwise 404.
  if (pathname === '/api/health' || pathname === '/api/reports' || CASE_STATUS_RE.test(pathname)) {
    return json({ error: 'method_not_allowed' }, 405, { allow: allowedFor(pathname) });
  }
  return jsonError('not_found', 404);
}

/**
 * @param {string} pathname
 * @returns {string}
 */
function allowedFor(pathname) {
  if (pathname === '/api/reports') return 'POST, OPTIONS';
  return 'GET, OPTIONS';
}

/**
 * Redact error messages to a short code — we never surface raw messages.
 * @param {unknown} err
 * @returns {string}
 */
function safeError(err) {
  if (err && typeof err === 'object' && 'name' in err) {
    return String(/** @type {any} */ (err).name || 'Error');
  }
  return 'Error';
}
