/** Normaliza un RUT chileno a "XXXXXXXX-D" (sin puntos, con guión, dígito verificador en mayúscula). */
export function normalizeRut(raw: string): string {
  const clean = raw.replace(/[.\s]/g, '').toUpperCase();
  if (!clean.includes('-')) {
    return `${clean.slice(0, -1)}-${clean.slice(-1)}`;
  }
  return clean;
}

/** Valida el dígito verificador de un RUT chileno (módulo 11). */
export function isValidRut(raw: string): boolean {
  const normalized = normalizeRut(raw);
  const match = normalized.match(/^(\d{7,8})-([\dK])$/);
  if (!match) return false;

  const [, body, checkDigit] = match;
  let sum = 0;
  let multiplier = 2;
  for (let i = body.length - 1; i >= 0; i -= 1) {
    sum += Number(body[i]) * multiplier;
    multiplier = multiplier === 7 ? 2 : multiplier + 1;
  }
  const remainder = 11 - (sum % 11);
  const expected = remainder === 11 ? '0' : remainder === 10 ? 'K' : String(remainder);
  return expected === checkDigit;
}
