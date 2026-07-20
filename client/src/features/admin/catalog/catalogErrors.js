/**
 * Map backend catalog error strings (English, returned as { error }) to friendly
 * Hebrew copy for the admin UI. Falls back to the raw message if it already looks
 * Hebrew, otherwise a generic Hebrew message — so a raw server string is never
 * shown as the only feedback.
 */

const HEBREW_RE = /[֐-׿]/;

// Ordered substring matchers — first match wins.
const RULES = [
  [/already exists/i, {
    field: 'כבר קיים תחום בשם זה',
    profession: 'כבר קיים מקצוע בשם זה בתחום הנבחר',
    service: 'כבר קיים שירות בשם זה במקצוע הנבחר',
    default: 'כבר קיים פריט בשם זה'
  }],
  [/cannot delete field/i, { default: 'לא ניתן למחוק תחום שמכיל מקצועות. יש להעביר או לארכב אותם קודם' }],
  [/cannot delete profession/i, { default: 'לא ניתן למחוק מקצוע שמכיל שירותים. יש להעביר או לארכב אותם קודם' }],
  [/cannot delete service template/i, { default: 'לא ניתן למחוק שירות שנמצא בשימוש על ידי עסקים' }],
  [/are required|is required/i, { default: 'יש למלא את כל שדות החובה' }],
  [/must be positive/i, { default: 'משך ברירת המחדל חייב להיות גדול מאפס' }],
  [/cannot be negative/i, { default: 'מחיר ברירת המחדל אינו יכול להיות שלילי' }],
  [/colorlevel must be/i, { default: 'רמת סיכון לא תקינה' }],
  [/field not found/i, { default: 'התחום לא נמצא' }],
  [/profession not found/i, { default: 'המקצוע לא נמצא' }],
  [/service template not found/i, { default: 'השירות לא נמצא' }]
];

/**
 * @param {Error} err   error thrown by api() (has .message and optional .data.error)
 * @param {'field'|'profession'|'service'} [context] resource context for tailored copy
 * @returns {string} Hebrew message
 */
export function toHebrewError(err, context) {
  const raw = (err && (err.data?.error || err.message)) || '';

  for (const [re, copy] of RULES) {
    if (re.test(raw)) {
      return copy[context] || copy.default;
    }
  }

  // Already Hebrew? show as-is. Otherwise generic.
  if (HEBREW_RE.test(raw)) return raw;
  return 'אירעה שגיאה. נסה שוב מאוחר יותר';
}
