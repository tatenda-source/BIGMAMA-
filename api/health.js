import { applyCors, withHeaders, json } from './_common.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  applyCors(req, res);
  withHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return json(res, 405, { error: 'method_not_allowed' });

  return json(res, 200, {
    status: 'ok',
    version: process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 7) ?? 'dev',
    time: new Date().toISOString(),
    region: process.env.VERCEL_REGION ?? 'local',
  });
}
