/**
 * Shared Calendar Utilities
 * Generic date/calendar helpers - no provider/booking logic
 */

/**
 * Format Date to YYYY-MM-DD in local timezone (avoiding UTC conversion)
 */
export function formatDateLocal(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Get Hebrew day names (short form)
 */
export function getHebrewDayNameShort(dayIndex) {
  const days = ['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ש׳'];
  return days[dayIndex];
}

/**
 * Get Hebrew day names (full form)
 */
export function getHebrewDayName(date) {
  const days = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
  return days[date.getDay()];
}

/**
 * Format month and year in Hebrew
 */
export function formatMonthYearHebrew(date) {
  const options = { year: 'numeric', month: 'long' };
  return date.toLocaleDateString('he-IL', options);
}

/**
 * Format date display in Hebrew
 */
export function formatDateDisplayHebrew(date) {
  const dayName = getHebrewDayName(date);
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  return `${dayName}, ${day}.${month}.${year}`;
}

/**
 * Check if date is today
 */
export function isToday(date) {
  const today = new Date();
  return formatDateLocal(date) === formatDateLocal(today);
}

/**
 * Check if two dates are the same day
 */
export function isSameDate(dateA, dateB) {
  if (!dateA || !dateB) return false;
  return formatDateLocal(dateA) === formatDateLocal(dateB);
}

/**
 * Check if date is in current month
 */
export function isInMonth(date, currentMonth) {
  return date.getMonth() === currentMonth.getMonth() &&
         date.getFullYear() === currentMonth.getFullYear();
}

/**
 * Get month grid (6 weeks × 7 days, starting Sunday)
 * Returns array of weeks, each week is array of Date objects
 */
export function getMonthGrid(year, month) {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  // Start from Sunday of the first week
  const startDate = new Date(firstDay);
  startDate.setDate(1 - firstDay.getDay());

  const weeks = [];
  let currentWeek = [];

  // Generate 6 weeks (42 days) for stable layout
  for (let i = 0; i < 42; i++) {
    const date = new Date(startDate);
    date.setDate(startDate.getDate() + i);

    currentWeek.push(date);

    if ((i + 1) % 7 === 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
  }

  return weeks;
}

/**
 * Check if current month is this month
 */
export function isThisMonth(date) {
  const now = new Date();
  return date.getMonth() === now.getMonth() &&
         date.getFullYear() === now.getFullYear();
}

/**
 * Add months to date
 */
export function addMonths(date, months) {
  const newDate = new Date(date);
  newDate.setMonth(newDate.getMonth() + months);
  return newDate;
}

/**
 * Add days to date
 */
export function addDays(date, days) {
  const newDate = new Date(date);
  newDate.setDate(newDate.getDate() + days);
  return newDate;
}
