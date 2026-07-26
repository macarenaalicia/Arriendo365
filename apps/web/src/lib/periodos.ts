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
 *
 * Un pago rechazado o que fue solo un abono no cierra el periodo: no cuenta
 * como "ya registrado" porque igual falta pagarlo (completo y aprobado).
 */
export function generarOpcionesPeriodo(pagosExistentes: Pago[]): {
  opciones: OpcionPeriodo[];
  proximoValue: string;
} {
  const mesesConPago = new Set(
    pagosExistentes
      .filter((p) => p.estado !== 'RECHAZADO' && !p.esAbono)
      .map((p) => p.fechaComprometida.slice(0, 7)),
  );
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

/**
 * Determina si un pago de arriendo debe marcarse como abono: se suma el
 * monto nuevo a los demás pagos ya registrados (no rechazados) para el
 * mismo periodo. Si esa suma alcanza o supera el monto del arriendo, este
 * pago cierra el ciclo y pasa a marcarse como completo aunque, por sí solo,
 * sea un monto parcial (ej. dos abonos que juntos completan el arriendo).
 */
export function calcularEsAbono(
  montoNuevo: number,
  montoArriendo: number,
  pagosMismoPeriodo: Pago[],
  excluirPagoId?: string,
): boolean {
  const sumaOtros = pagosMismoPeriodo
    .filter((p) => p.id !== excluirPagoId && p.estado !== 'RECHAZADO')
    .reduce((acc, p) => acc + Number(p.monto), 0);
  return sumaOtros + montoNuevo < montoArriendo;
}

export type TipoPagoClasificado = 'completo' | 'abono';

export const TIPO_PAGO_CLASIFICADO_LABELS: Record<TipoPagoClasificado, string> = {
  completo: 'Pago completo',
  abono: 'Abono',
};

/** Clasifica un pago de arriendo: "abono" si no cierra el saldo del periodo, "completo" si lo cierra. */
export function clasificarTipoPago(pago: Pago): TipoPagoClasificado {
  return pago.esAbono ? 'abono' : 'completo';
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
