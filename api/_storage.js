/**
 * In-memory storage for the Vercel MVP.
 *
 * Each serverless instance holds its own Map. That means:
 *   - Idempotency works WITHIN a warm instance but does not span instances
 *     or deploys.
 *   - Reports are not durable; a cold start or redeploy loses them.
 *
 * This is deliberate for the dissertation MVP — honest, testable, and free.
 * Production would back these with Vercel KV (for idempotency) + Vercel
 * Postgres (for report ciphertext). The swap is a one-file change; all
 * business logic stays the same.
 */

const MAX_REPORTS = 500;
const IDEMPOTENCY_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/** @type {Map<string, { caseId: string, createdAt: number }>} */
const idempotencyLedger = new Map();

/** @type {Map<string, { caseId: string, status: string, createdAt: number }>} */
const reports = new Map();

export function getIdempotent(key) {
  const entry = idempotencyLedger.get(key);
  if (!entry) return null;
  if (Date.now() - entry.createdAt > IDEMPOTENCY_TTL_MS) {
    idempotencyLedger.delete(key);
    return null;
  }
  return entry;
}

export function rememberIdempotent(key, caseId) {
  if (idempotencyLedger.size >= 10_000) {
    // FIFO eviction — prevents runaway memory on a single warm instance.
    const oldest = idempotencyLedger.keys().next().value;
    if (oldest) idempotencyLedger.delete(oldest);
  }
  idempotencyLedger.set(key, { caseId, createdAt: Date.now() });
}

export function storeReport(caseId, _ciphertextStruct) {
  if (reports.size >= MAX_REPORTS) {
    const oldest = reports.keys().next().value;
    if (oldest) reports.delete(oldest);
  }
  reports.set(caseId, { caseId, status: 'received', createdAt: Date.now() });
}

export function getReport(caseId) {
  return reports.get(caseId) ?? null;
}
