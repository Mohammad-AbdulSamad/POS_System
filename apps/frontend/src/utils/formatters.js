/**
 * Format a phone number for display.
 * - Supports local Israeli formats (starts with 0 or +972)
 * - Supports common US/Intl formats (10-digit, +1 prefix)
 * - Falls back to grouping digits when possible
 *
 * Examples:
 *  formatPhoneNumber("0501234567") => "050-123-4567"
 *  formatPhoneNumber("972501234567") => "050-123-4567"
 *  formatPhoneNumber("+972501234567") => "050-123-4567"
 *  formatPhoneNumber("15551234567") => "+1 (555) 123-4567"
 *  formatPhoneNumber("5551234567") => "555-123-4567"
 *
 * @param {string|number} input
 * @returns {string}
 */
export function formatPhoneNumber(input) {
  if (input === null || input === undefined) return '';

  const str = String(input).trim();
  if (!str) return '';

  // Remove all non-digit characters, but preserve leading +
  const cleaned = (str.startsWith('+') ? '+' : '') + str.replace(/[^\d]/g, '');

  // If plus-prefixed, strip the plus for analysis
  const noPlus = cleaned.startsWith('+') ? cleaned.slice(1) : cleaned;

  // Helper: format as 3-3-4 (common for many locales)
  const fmt334 = (digits) => {
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)}-${digits.slice(3)}`;
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  };

  // Israeli numbers (common): 10 digits starting with 0; or 12 digits starting with 972
  if (noPlus.startsWith('972')) {
    const rest = noPlus.slice(3); // e.g., 501234567
    if (rest.length === 9) {
      // convert to local 0-prefixed format
      const local = `0${rest}`;
      return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
    }
  }

  // Local Israeli without country code (9 or 10 digits)
  if (noPlus.length === 9) {
    // treat as missing leading zero: e.g., 501234567 -> 050-123-4567
    const local = `0${noPlus}`;
    return `${local.slice(0, 3)}-${local.slice(3, 6)}-${local.slice(6)}`;
  }
  if (noPlus.length === 10 && noPlus.startsWith('0')) {
    return `${noPlus.slice(0, 3)}-${noPlus.slice(3, 6)}-${noPlus.slice(6)}`;
  }

  // US / NANP (10 digits) or with leading 1 (11 digits)
  if (noPlus.length === 11 && noPlus.startsWith('1')) {
    const digits = noPlus.slice(1);
    return `+1 (${digits.slice(0, 3)}) ${digits.slice(3, 6)}-${digits.slice(6, 10)}`;
  }
  if (noPlus.length === 10) {
    return fmt334(noPlus);
  }

  // If there's an explicit plus and a country code we don't recognize, show international style
  if (cleaned.startsWith('+')) {
    // Try to pretty print: show +CCC and the remaining grouped
    let cc = '';
    let rest = noPlus;
    // Heuristics: country codes are 1-3 digits; attempt to separate cc
    for (let i = 1; i <= 3; i++) {
      const possibleCc = noPlus.slice(0, i);
      const remaining = noPlus.slice(i);
      // prefer common codes 1, 44, 33, 972 etc or fallback if remaining length >= 4
      if (possibleCc === '1' || possibleCc === '44' || possibleCc === '33' || possibleCc === '972' || remaining.length >= 4) {
        cc = possibleCc;
        rest = remaining;
        break;
      }
    }
    const grouped = fmt334(rest);
    return `+${cc} ${grouped}`;
  }

  // Final fallback: group digits in 3-3-4 when possible, otherwise return digits as-is
  return fmt334(noPlus);
}

// ✅ New: formatDateTime helper
/**
 * Format an ISO date/time or Date object into a human friendly string.
 *
 * Examples:
 *  formatDateTime("2025-10-31T11:09:21.112Z") => "Oct 31, 11:09 AM"
 *  formatDateTime(new Date(), { includeYear: true }) => "Nov 25, 2025, 02:15 PM"
 *
 * @param {string|number|Date} value - ISO string, timestamp, or Date object
 * @param {object} options
 * @param {string} [options.locale='en-US']
 * @param {boolean} [options.includeYear=false] - show the year (e.g., "Nov 25, 2025")
 * @param {boolean} [options.hour12=true] - 12-hour clock
 * @returns {string} formatted date/time or '' if invalid
 */
export function formatDateTime(value, { locale = 'en-US', includeYear = false, hour12 = true } = {}) {
  if (value === null || value === undefined || value === '') return '';

  const date = value instanceof Date ? value : new Date(value);

  if (isNaN(date.getTime())) return '';

  const options = {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
    hour12,
  };

  if (includeYear) {
    options.year = 'numeric';
  }

  try {
    return new Intl.DateTimeFormat(locale, options).format(date);
  } catch (e) {
    // Fallback: basic manual formatting
    const y = date.getFullYear();
    const m = date.toLocaleString(locale, { month: 'short' });
    const d = String(date.getDate()).padStart(2, '0');

    let hours = date.getHours();
    let minutes = String(date.getMinutes()).padStart(2, '0');
    if (hour12) {
      const suffix = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12 || 12;
      return `${m} ${d}${includeYear ? `, ${y}` : ''}, ${hours}:${minutes} ${suffix}`;
    }
    return `${m} ${d}${includeYear ? `, ${y}` : ''}, ${String(hours).padStart(2, '0')}:${minutes}`;
  }
}

// ✅ New: formatCurrency helper
/**
 * Format a numeric value as currency for display.
 *
 * Examples:
 *  formatCurrency(1234.5) => "₪1,234.50"
 *  formatCurrency("1234.5", { locale: 'en-US', currencyCode: 'USD' }) => "$1,234.50"
 *
 * @param {number|string|object} value - The numeric value to format (supports number, string, Decimal-like)
 * @param {object} options
 * @param {string} [options.locale='en-US'] - Locale for number formatting
 * @param {string|null} [options.currencyCode=null] - ISO currency code (e.g., 'USD', 'ILS'). If provided uses Intl currency formatting.
 * @param {string} [options.currencySymbol='₪'] - Symbol to use when currencyCode is not provided
 * @param {boolean} [options.showSymbol=true] - Whether to prepend/apply currency symbol
 * @param {number} [options.minimumFractionDigits=2]
 * @param {number} [options.maximumFractionDigits=2]
 * @returns {string} Formatted currency string or '' if invalid value
 */
export function formatCurrency(
  value,
  {
    locale = 'en-US',
    currencyCode = null,
    currencySymbol = '₪',
    showSymbol = true,
    minimumFractionDigits = 2,
    maximumFractionDigits = 2,
  } = {}
) {
  if (value === null || value === undefined || value === '') return '';

  // Accept Decimal-like objects (e.g., Prisma Decimal) by converting to string first
  const num = Number(typeof value === 'object' && value !== null ? String(value) : value);

  if (Number.isNaN(num)) return '';

  // Use Intl currency formatting if currencyCode provided
  if (currencyCode) {
    try {
      return new Intl.NumberFormat(locale, {
        style: 'currency',
        currency: currencyCode,
        minimumFractionDigits,
        maximumFractionDigits,
      }).format(num);
    } catch (e) {
      // Fallback to symbol-based formatting below
    }
  }

  // Fallback: format number and prepend currencySymbol
  const formatted = new Intl.NumberFormat(locale, {
    minimumFractionDigits,
    maximumFractionDigits,
  }).format(num);

  return showSymbol ? `${currencySymbol}${formatted}` : formatted;
}

export default {
  formatPhoneNumber,
  formatDateTime,
  formatCurrency,
};