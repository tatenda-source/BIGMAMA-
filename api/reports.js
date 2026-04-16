import { applyCors, withHeaders, json, jsonError, readBody, callerIp } from './_common.js';
import { validateReportBody, isValidIdempotencyKey } from '../server/src/lib/validate.js';
import { mintCaseId } from '../server/src/lib/case-id.js';
import { getIdempotent, rememberIdempotent, storeReport } from './_storage.js';

export const config = { runtime: 'nodejs' };

const MAX_BODY_BYTES = 262_144;

export default async function handler(req, res) {
  applyCors(req, res);
  withHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'POST') return jsonError(res, 'method_not_allowed', 405);

  if ((req.headers['content-type'] ?? '').split(';')[0].trim() !== 'application/json') {
    return jsonError(res, 'unsupported_media_type', 415);
  }

  const idempotencyKey = req.headers['idempotency-key'];
  if (!isValidIdempotencyKey(idempotencyKey)) {
    return jsonError(res, 'bad_idempotency_key', 400);
  }

  let raw;
  try {
    raw = await readBody(req, MAX_BODY_BYTES);
  } catch (err) {
    if (err?.code === 'E_TOO_LARGE') return jsonError(res, 'body_too_large', 413);
    return jsonError(res, 'bad_request', 400);
  }

  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    return jsonError(res, 'bad_json', 400);
  }

  const validation = validateReportBody(parsed);
  if (!validation.ok) return jsonError(res, validation.error, 400);

  const cached = getIdempotent(idempotencyKey);
  if (cached) {
    return json(res, 200, { caseId: cached.caseId, status: 'duplicate' });
  }

  const secret = process.env.SERVER_SECRET;
  if (!secret || secret.length < 16) {
    return jsonError(res, 'server_misconfigured', 500);
  }
  const bucket = Math.floor(Date.now() / (60 * 60 * 1000));
  const caseId = await mintCaseId(idempotencyKey, secret, bucket);

  storeReport(caseId, validation.body);
  rememberIdempotent(idempotencyKey, caseId);

  logEvent({ caseId, status: 'received', ipHash: hashIp(callerIp(req)) });
  return json(res, 201, { caseId, status: 'received' });
}

function hashIp(ip) {
  let h = 0;
  for (let i = 0; i < ip.length; i++) h = (h * 31 + ip.charCodeAt(i)) | 0;
  return (h >>> 0).toString(16);
}

function logEvent(ev) {
  console.log(JSON.stringify({ evt: 'report', ...ev }));
}
