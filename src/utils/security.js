/**
 * Security utilities for BIGMAMA$ platform
 * Simulates AES-256 encryption and data scrubbing for the prototype.
 */

export const encryptData = (data) => {
  // Simulation: Base64 + Salt
  const salt = "BIGMAMA_SALT_";
  return btoa(salt + JSON.stringify(data));
};

export const sanitizeInput = (text) => {
  return text.replace(/[<>]/g, ''); // Simple XSS prevention
};

export const generateCaseId = () => {
  return `ZR-${Math.floor(Math.random() * 90000) + 10000}`;
};
