function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

/**
 * Builds a case-insensitive regex that matches a mobile number regardless of
 * how dashes/spaces were typed when it was stored (e.g. "0300-1234567" vs
 * "03001234567"), by matching digit-by-digit with optional separators.
 */
export function buildMobileSearchRegex(rawQuery: string): RegExp {
  const digits = rawQuery.replace(/\D/g, "");
  if (!digits) return new RegExp(escapeRegex(rawQuery.trim()), "i");
  return new RegExp(digits.split("").join("[-\\s]*"), "i");
}
