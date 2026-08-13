/**
 * Deep-clone an ECharts option object, stripping any values that are
 * functions, contain inline JS, or carry custom CSS styling.
 * Returns a clean JSON-safe object.
 */
export function sanitizeOption(option) {
  if (option == null || typeof option !== "object") return option;
  if (Array.isArray(option)) return option.map(sanitizeOption);

  const clean = {};
  for (const key of Object.keys(option)) {
    const value = option[key];

    // Strip function values (formatters, event handlers, etc.)
    if (typeof value === "function") continue;

    // Strip string values that look like inline JS
    if (typeof value === "string" && /^\s*function\s*\(|=>\s*{/.test(value)) continue;

    // Recurse into nested objects/arrays
    if (typeof value === "object" && value !== null) {
      clean[key] = sanitizeOption(value);
    } else {
      clean[key] = value;
    }
  }
  return clean;
}
