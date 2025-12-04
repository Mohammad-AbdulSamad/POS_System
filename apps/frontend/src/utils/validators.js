// src/utils/validators.js

/**
 * Validation Utilities
 *
 * Reusable validation functions for forms and data validation.
 * Pure functions that return error messages or null if valid.
 */

/**
 * Validation constants used across the app
 */
export const VALIDATION = {
  // Product / Name
  MIN_PRODUCT_NAME_LENGTH: 3,
  MAX_PRODUCT_NAME_LENGTH: 255,

  // Price limits
  MIN_PRICE: 0,
  MAX_PRICE: 10000000,

  // Stock limits
  MIN_STOCK: 0,
  MAX_STOCK: 10000000,

  // SKU / Barcode
  SKU_REGEX: /^[A-Za-z0-9-_]+$/,         // Accept letters, numbers, -, _
  BARCODE_REGEX: /^\d{8,13}$/,           // 8-13 digits (EAN/UPC-ish)

  // Phone
  // Accepts +country prefix or local numbers with common separators
  PHONE_REGEX: /^\+?[0-9\s().-]{7,20}$/,
};

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateEmail = (email) => {
  if (!email) {
    return 'Email is required';
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return 'Please enter a valid email address';
  }

  return null;
};

/**
 * Validate password
 * @param {string} password - Password to validate
 * @param {object} options - Validation options
 * @returns {string|null} - Error message or null if valid
 */
export const validatePassword = (password, options = {}) => {
  const {
    minLength = 8,
    requireUppercase = true,
    requireLowercase = true,
    requireNumber = true,
    requireSpecial = false,
  } = options;

  if (!password) {
    return 'Password is required';
  }

  if (password.length < minLength) {
    return `Password must be at least ${minLength} characters`;
  }

  if (requireUppercase && !/[A-Z]/.test(password)) {
    return 'Password must contain at least one uppercase letter';
  }

  if (requireLowercase && !/[a-z]/.test(password)) {
    return 'Password must contain at least one lowercase letter';
  }

  if (requireNumber && !/\d/.test(password)) {
    return 'Password must contain at least one number';
  }

  if (requireSpecial && !/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    return 'Password must contain at least one special character';
  }

  return null;
};

/**
 * Validate password confirmation
 * @param {string} password - Original password
 * @param {string} confirmPassword - Password confirmation
 * @returns {string|null} - Error message or null if valid
 */
export const validatePasswordMatch = (password, confirmPassword) => {
  if (!confirmPassword) {
    return 'Please confirm your password';
  }

  if (password !== confirmPassword) {
    return 'Passwords do not match';
  }

  return null;
};

/**
 * Validate required field
 * @param {any} value - Value to validate
 * @param {string} fieldName - Name of the field for error message
 * @returns {string|null} - Error message or null if valid
 */
export const validateRequired = (value, fieldName = 'This field') => {
  if (value === null || value === undefined) {
    return `${fieldName} is required`;
  }
  if (typeof value === 'string' && value.trim() === '') {
    return `${fieldName} is required`;
  }
  return null;
};

/**
 * Validate phone number
 * - Optional by default: returns null when empty.
 * - Returns a string error when invalid.
 * @param {string} phone - Phone number to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validatePhone = (phone) => {
  if (phone === null || phone === undefined || String(phone).trim() === '') {
    // Optional by default
    return null;
  }

  // Keep + prefix and digits, remove other characters
  const cleaned = String(phone).trim();

  if (!VALIDATION.PHONE_REGEX.test(cleaned)) {
    return 'Please enter a valid phone number';
  }

  // Basic digits length check (ignore + and punctuation)
  const digits = cleaned.replace(/\D/g, '');
  if (digits.length < 7) {
    return 'Please enter a valid phone number';
  }

  return null;
};

/**
 * Validate phone number and require it.
 */
export const validatePhoneRequired = (phone) => {
  const err = validatePhone(phone);
  if (err) return err;
  if (phone === null || phone === undefined || String(phone).trim() === '') {
    return 'Phone number is required';
  }
  return null;
};

/**
 * Validate numeric value
 * @param {any} value - Value to validate
 * @param {object} options - Validation options
 * @returns {string|null} - Error message or null if valid
 */
export const validateNumber = (value, options = {}) => {
  const { min, max, integer = false } = options;

  if (value === '' || value === null || value === undefined) {
    return 'Please enter a number';
  }

  const num = Number(value);

  if (isNaN(num)) {
    return 'Please enter a valid number';
  }

  if (integer && !Number.isInteger(num)) {
    return 'Please enter a whole number';
  }

  if (min !== undefined && num < min) {
    return `Value must be at least ${min}`;
  }

  if (max !== undefined && num > max) {
    return `Value must be at most ${max}`;
  }

  return null;
};

/**
 * Validate price
 * @param {any} price - Price to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validatePrice = (price) => {
  if (price === '' || price === null || price === undefined) {
    return 'Price is required';
  }

  const num = Number(price);

  if (isNaN(num)) {
    return 'Please enter a valid price';
  }

  if (num < 0) {
    return 'Price cannot be negative';
  }

  if (num < VALIDATION.MIN_PRICE) {
    return `Price must be at least ${VALIDATION.MIN_PRICE}`;
  }
  if (num > VALIDATION.MAX_PRICE) {
    return `Price cannot exceed ${VALIDATION.MAX_PRICE}`;
  }

  return null;
};

/**
 * Validate SKU
 * @param {string} sku - SKU to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateSKU = (sku) => {
  if (!sku) {
    return 'SKU is required';
  }

  if (String(sku).length < 3) {
    return 'SKU must be at least 3 characters';
  }

  if (!VALIDATION.SKU_REGEX.test(String(sku))) {
    return 'SKU can only contain letters, numbers, hyphens, and underscores';
  }

  return null;
};

/**
 * Validate URL
 * @param {string} url - URL to validate
 * @returns {string|null} - Error message or null if valid
 */
export const validateURL = (url) => {
  if (!url) {
    return null; // URL is optional
  }

  try {
    new URL(url);
    return null;
  } catch {
    return 'Please enter a valid URL';
  }
};

/**
 * Validate date
 * @param {string} date - Date to validate
 * @param {object} options - Validation options
 * @returns {string|null} - Error message or null if valid
 */
export const validateDate = (date, options = {}) => {
  const { minDate, maxDate, futureOnly = false, pastOnly = false } = options;

  if (!date) {
    return 'Date is required';
  }

  const dateObj = new Date(date);

  if (isNaN(dateObj.getTime())) {
    return 'Please enter a valid date';
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  if (futureOnly && dateObj < today) {
    return 'Date must be in the future';
  }

  if (pastOnly && dateObj > today) {
    return 'Date must be in the past';
  }

  if (minDate && dateObj < new Date(minDate)) {
    return `Date must be after ${minDate}`;
  }

  if (maxDate && dateObj > new Date(maxDate)) {
    return `Date must be before ${maxDate}`;
  }

  return null;
};

/**
 * Validate form object
 * @param {object} data - Form data object
 * @param {object} rules - Validation rules
 * @returns {object} - Object with field errors
 */
export const validateForm = (data, rules) => {
  const errors = {};

  Object.keys(rules).forEach((field) => {
    const rule = rules[field];
    const value = data[field];

    if (typeof rule === 'function') {
      const error = rule(value, data);
      if (error) {
        errors[field] = error;
      }
    }
  });

  return errors;
};

/**
 * Check if form has errors
 * @param {object} errors - Errors object
 * @returns {boolean} - True if has errors
 */
export const hasErrors = (errors) => {
  return Object.keys(errors).length > 0;
};

/**
 * Example usage with validateForm:
 *
 * const loginRules = {
 *   email: validateEmail,
 *   password: (value) => validatePassword(value, { minLength: 6 }),
 * };
 *
 * const errors = validateForm(formData, loginRules);
 *
 * if (hasErrors(errors)) {
 *   // Show errors
 * } else {
 *   // Submit form
 * }
 */

export default {
  VALIDATION,
  validateEmail,
  validatePassword,
  validatePasswordMatch,
  validateRequired,
  validatePhone,
  validatePhoneRequired,
  validateNumber,
  validatePrice,
  validateSKU,
  validateURL,
  validateDate,
  validateForm,
  hasErrors,
};