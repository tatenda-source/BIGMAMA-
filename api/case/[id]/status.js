import { applyCors, withHeaders, json, jsonError } from '../../_common.js';
import { isValidCaseId } from '../../../server/src/lib/case-id.js';
import { getReport } from '../../_storage.js';

export const config = { runtime: 'nodejs' };

export default async function handler(req, res) {
  applyCors(req, res);
  withHeaders(res);
  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return jsonError(res, 'method_not_allowed', 405);

  const id = req.query?.id;
  if (!isValidCaseId(id)) return jsonError(res, 'bad_case_id', 400);

  const report = getReport(id);
  if (!report) return json(res, 200, { status: 'not_found' });
  return json(res, 200, { status: report.status });
}
