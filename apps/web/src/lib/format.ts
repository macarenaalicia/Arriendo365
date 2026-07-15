export function formatEnumLabel(value: string): string {
  return value.replace(/_/g, ' ');
}

// Reordena los primeros 10 caracteres (yyyy-mm-dd) del ISO string a dd/mm/aaaa
// sin pasar por Date/Intl, para evitar que un desfase de zona horaria corra
// el día mostrado.
export function formatFecha(fecha: string): string {
  const [year, month, day] = fecha.slice(0, 10).split('-');
  return `${day}/${month}/${year}`;
}

export function isoToDdmmyyyy(iso: string | null | undefined): string {
  if (!iso) return '';
  return formatFecha(iso);
}

export function ddmmyyyyToIso(value: string): string | undefined {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value);
  if (!match) return undefined;
  const [, day, month, year] = match;
  return `${year}-${month}-${day}`;
}

// Convierte "141" -> "14/1", "14072026" -> "14/07/2026", insertando las
// barras a medida que se escribe (solo dígitos).
export function maskFechaDDMMYYYY(raw: string): string {
  const digits = raw.replace(/\D/g, '').slice(0, 8);
  const partes = [digits.slice(0, 2), digits.slice(2, 4), digits.slice(4, 8)].filter(Boolean);
  return partes.join('/');
}
