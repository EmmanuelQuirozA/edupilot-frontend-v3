export function createCurrencyFormatter(
  locale: string,
  currency: string
) {
  // Normaliza locale para que siempre funcione correctamente con MXN
  const normalizedLocale =
    locale === "es" ? "es-MX" : locale === "en" ? "en-US" : locale;

  return new Intl.NumberFormat(normalizedLocale, {
    style: "currency",
    currency,
    currencyDisplay: "symbol", // <- usa símbolo ($)
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}
