/**
 * Validation utilities for BIGMAMA$ platform
 */

export const validateReport = (data) => {
  const errors = {};
  if (!data.title || data.title.length < 5) {
    errors.title = "Title must be at least 5 characters.";
  }
  if (!data.description || data.description.length < 10) {
    errors.description = "Description must be at least 10 characters.";
  }
  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

export const isValidEmail = (email) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
};
