/**
 * Report validation.
 *
 * Pre-flight checks before a report reaches the submission pipeline. All
 * checks here are advisory UX — the real security barriers are sanitisation
 * in `src/lib/sanitize.js` and server-side validation. This module does NOT
 * block adversarial payloads; it surfaces friendly messages when a report is
 * obviously incomplete.
 */

import { sanitizeText, hasPrototypePollutionKey } from '../lib/sanitize.js';

const TITLE_MIN = 5;
const TITLE_MAX = 140;
const DESCRIPTION_MIN = 10;
const DESCRIPTION_MAX = 5000;

/**
 * @param {object} data
 * @returns {{ isValid: boolean, errors: Record<string,string>, sanitized?: object }}
 */
export const validateReport = (data) => {
  const errors = {};

  if (!data || typeof data !== 'object' || hasPrototypePollutionKey(data)) {
    return { isValid: false, errors: { _form: 'Invalid form state.' } };
  }

  const title = typeof data.title === 'string' ? data.title.trim() : '';
  const description = typeof data.description === 'string' ? data.description.trim() : '';

  if (title.length < TITLE_MIN) {
    errors.title = `Title must be at least ${TITLE_MIN} characters.`;
  } else if (title.length > TITLE_MAX) {
    errors.title = `Title must be ${TITLE_MAX} characters or fewer.`;
  }

  if (description.length < DESCRIPTION_MIN) {
    errors.description = `Description must be at least ${DESCRIPTION_MIN} characters.`;
  } else if (description.length > DESCRIPTION_MAX) {
    errors.description = `Description must be ${DESCRIPTION_MAX} characters or fewer.`;
  }

  const sanitized = {
    ...data,
    title: sanitizeText(title, { maxLen: TITLE_MAX }),
    description: sanitizeText(description, { maxLen: DESCRIPTION_MAX }),
  };

  return {
    isValid: Object.keys(errors).length === 0,
    errors,
    sanitized,
  };
};

export const isValidEmail = (email) => {
  if (typeof email !== 'string' || email.length > 254) return false;
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
