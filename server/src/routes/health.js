/**
 * @file health.js — Liveness probe.
 *
 * Deliberately does NOT touch D1 or KV. Health must be fast and independent
 * of downstream state; deep checks belong in a separate /readyz endpoint if
 * we ever need one. `region` comes from `request.cf.colo` so ops can spot
 * geographic anomalies without decrypting anything else.
 */

import { json } from '../lib/response.js';

/**
 * @param {Request} request
 * @param {{ VERSION?: string }} env
 * @returns {Response}
 */
export function handleHealth(request, env) {
  // `cf` is populated on the Workers runtime; absent in some test shims.
  const cf = /** @type {any} */ (request).cf;
  const region = (cf && typeof cf.colo === 'string') ? cf.colo : 'unknown';
  return json({
    status: 'ok',
    version: env.VERSION || '0.0.0',
    time: new Date().toISOString(),
    region,
  });
}
