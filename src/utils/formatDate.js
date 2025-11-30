// src/utils/formatDate.js

/**
 * Format an ISO date (or date-parsable string) according to Intl.DateTimeFormat.
 *
 * @param {string|Date|null|undefined} value   — the date to format
 * @param {string}                   locale  — e.g. "en-US" or i18n.language
 * @param {Intl.DateTimeFormatOptions} options — e.g. { year: "numeric", month: "long", day: "2-digit" }
 * @returns {string} formatted date or empty string if no value
 */
export function formatDate(value, locale, options) {
  if (!value) return '';
  const date = (value instanceof Date) ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return '';
  return new Intl.DateTimeFormat(locale, options).format(date);
}