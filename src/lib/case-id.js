/**
 * @file case-id.js — UI-facing re-export of {@link randomCaseId}.
 *
 * Kept as a dedicated module so components can import case-id generation
 * without pulling in the whole crypto surface (tree-shake friendly) and
 * without coupling UI code to the crypto module's path.
 */

export { randomCaseId } from './crypto.js';
