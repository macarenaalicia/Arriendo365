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
