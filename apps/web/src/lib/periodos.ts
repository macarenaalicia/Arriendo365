import type { Pago } from '../api/types';

export const MEDIOS_PAGO = [
  'Transferencia',
  'Efectivo',
  'Depósito',
  'Cheque',
  'Tarjeta de débito',
  'Tarjeta de crédito',
] as const;

export interface OpcionPeriodo {
  value: string; // yyyy-mm
  label: string;
}

function nombreMesAno(fecha: Date): string {
  const nombre = fecha.toLocaleDateString('es-CL', { month: 'long', year: 'numeric' });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

/**
 * Genera meses candidatos (2 hacia atrás, 3 hacia adelante) para elegir a qué
 * periodo corresponde el pago, marcando cuál es el "próximo" pendiente (el
 * primer mes, desde hoy en adelante, que todavía no tiene un pago registrado).
 */
export function generarOpcionesPeriodo(pagosExistentes: Pago[]): {
  opciones: OpcionPeriodo[];
  proximoValue: string;
} {
  const mesesConPago = new Set(pagosExistentes.map((p) => p.fechaComprometida.slice(0, 7)));
  const hoy = new Date();
  const opciones: OpcionPeriodo[] = [];
  let proximoValue = '';

  for (let i = -2; i <= 3; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    const value = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, '0')}`;
    const yaRegistrado = mesesConPago.has(value);
    const esProximo = !yaRegistrado && i >= 0 && !proximoValue;
    if (esProximo) proximoValue = value;

    opciones.push({
      value,
      label: `${nombreMesAno(fecha)}${esProximo ? ' (próximo)' : ''}${
        yaRegistrado ? ' — ya registrado' : ''
      }`,
    });
  }

  if (!proximoValue) {
    proximoValue = opciones[2].value;
  }

  return { opciones, proximoValue };
}

/** Combina el mes elegido (yyyy-mm) con el día de pago del arriendo -> yyyy-mm-dd */
export function periodoValorAFecha(value: string, diaPago: number): string {
  const [year, month] = value.split('-').map(Number);
  const ultimoDiaDelMes = new Date(year, month, 0).getDate();
  const dia = Math.min(diaPago, ultimoDiaDelMes);
  return `${year}-${String(month).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
}

/** Asegura que el mes de un pago existente (al editar) esté en la lista, aunque caiga fuera de la ventana. */
export function asegurarOpcion(opciones: OpcionPeriodo[], value: string): OpcionPeriodo[] {
  if (opciones.some((o) => o.value === value)) return opciones;
  const [year, month] = value.split('-').map(Number);
  const fecha = new Date(year, month - 1, 1);
  return [...opciones, { value, label: nombreMesAno(fecha) }].sort((a, b) =>
    a.value.localeCompare(b.value),
  );
}
