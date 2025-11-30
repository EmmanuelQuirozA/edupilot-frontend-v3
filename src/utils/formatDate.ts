// src/utils/formatDate.ts

/**
 * Format an ISO date (or date-parsable string) according to Intl.DateTimeFormat.
 *
 * @param value   — the date to format
 * @param locale  — e.g. "en-US" or i18n.language
 * @param options — e.g. { year: "numeric", month: "long", day: "2-digit" }
 * @returns formatted date or empty string if no value
 */
export function formatDate(
  value: string | Date | null | undefined,
  locale: string,
  options?: Intl.DateTimeFormatOptions,
): string {
  if (!value) return ''
  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return new Intl.DateTimeFormat(locale, options).format(date)
}
