/**
 * Israeli Identifier Validation Utilities
 *
 * Validates official Israeli business identifiers:
 * - Israeli ID (תעודת זהות)
 * - Company Number (ח.פ. / ח.ק.)
 * - Authorized Dealer (עוסק מורשה)
 * - Exempt Dealer (עוסק פטור)
 */

/**
 * Validate Israeli ID (תעודת זהות) using official checksum algorithm
 * @param {string} id - Israeli ID number
 * @returns {{valid: boolean, error: string|null, normalized: string|null}}
 */
function validateIsraeliID(id) {
  // Remove spaces and dashes
  let cleaned = id.replace(/[\s-]/g, '');

  // Pad with leading zeros to 9 digits
  cleaned = cleaned.padStart(9, '0');

  // Must be exactly 9 digits
  if (cleaned.length !== 9 || !/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      error: 'תעודת זהות חייבת להכיל 9 ספרות',
      normalized: null
    };
  }

  // Calculate checksum using official Israeli ID algorithm
  let sum = 0;
  for (let i = 0; i < 9; i++) {
    let digit = parseInt(cleaned[i]);
    let step = digit * ((i % 2) + 1);
    sum += step > 9 ? step - 9 : step;
  }

  const isValid = sum % 10 === 0;

  return {
    valid: isValid,
    error: isValid ? null : 'מספר תעודת זהות לא תקין (בדיקת ספרת ביקורת נכשלה)',
    normalized: cleaned
  };
}

/**
 * Validate Company Number (ח.פ. / ח.ק.)
 * @param {string} number - Company number
 * @returns {{valid: boolean, error: string|null, normalized: string|null}}
 */
function validateCompanyNumber(number) {
  let cleaned = number.replace(/[\s-]/g, '');
  cleaned = cleaned.padStart(9, '0');

  if (cleaned.length !== 9 || !/^\d+$/.test(cleaned)) {
    return {
      valid: false,
      error: 'מספר חברה חייב להכיל 9 ספרות',
      normalized: null
    };
  }

  return {
    valid: true,
    error: null,
    normalized: cleaned
  };
}

/**
 * Master validation function for all identifier types
 * @param {string} type - One of: ISRAELI_ID, COMPANY_NUMBER, AUTHORIZED_DEALER, EXEMPT_DEALER
 * @param {string} value - The identifier value
 * @returns {{valid: boolean, error: string|null, normalized: string|null}}
 */
function validateIdentifier(type, value) {
  if (!value || typeof value !== 'string') {
    return {
      valid: false,
      error: 'מזהה חסר',
      normalized: null
    };
  }

  switch (type) {
    case 'ISRAELI_ID':
      return validateIsraeliID(value);

    case 'COMPANY_NUMBER':
    case 'AUTHORIZED_DEALER':
    case 'EXEMPT_DEALER':
      return validateCompanyNumber(value);

    default:
      return {
        valid: false,
        error: 'סוג מזהה לא ידוע',
        normalized: null
      };
  }
}

/**
 * Get Hebrew label for identifier type
 * @param {string} type - Identifier type
 * @returns {string} Hebrew label
 */
function getIdentifierTypeLabel(type) {
  const labels = {
    ISRAELI_ID: 'תעודת זהות',
    COMPANY_NUMBER: 'חברה בע"מ',
    AUTHORIZED_DEALER: 'עוסק מורשה',
    EXEMPT_DEALER: 'עוסק פטור'
  };
  return labels[type] || type;
}

/**
 * Mask identifier for display (privacy)
 * Shows only last 4 digits for Israeli ID, last 5 for company numbers
 * @param {string} type - Identifier type
 * @param {string} value - Identifier value
 * @returns {string} Masked value
 */
function maskIdentifier(type, value) {
  if (!value) return '';

  if (type === 'ISRAELI_ID') {
    const last4 = value.slice(-4);
    return `*****${last4}`;
  }

  // For company numbers, show last 5 digits
  const last5 = value.slice(-5);
  return `****${last5}`;
}

module.exports = {
  validateIsraeliID,
  validateCompanyNumber,
  validateIdentifier,
  getIdentifierTypeLabel,
  maskIdentifier
};
