import { formatFecha } from './format';

const MESES_POR_PERIODO: Record<string, number> = {
  MENSUAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

const GRACIA_DIAS = 15;

export type EstadoAlza = 'vencido' | 'proximo' | 'vigente';

export interface ProximaAlza {
  fechaIso: string;
  dias: number;
  estado: EstadoAlza;
}

/**
 * Calcula el próximo aniversario del contrato en que corresponde revisar el
 * reajuste, a partir de la fecha de entrega y el periodo de alza.
 *
 * No existe un campo que registre "la última vez que se subió el arriendo",
 * así que esto es una estimación por calendario: si un aniversario ya pasó
 * hace poco (dentro de GRACIA_DIAS), se sigue mostrando como el pendiente en
 * vez de saltar al siguiente ciclo — para no esconder que ya toca revisarlo.
 */
export function calcularProximaAlza(
  fechaEntregaIso: string,
  periodoAlza: string,
): ProximaAlza | null {
  const meses = MESES_POR_PERIODO[periodoAlza];
  if (!meses) return null; // "SIN REAJUSTE" u otro valor no reconocido

  const hoy = new Date();
  const limite = new Date(hoy);
  limite.setDate(limite.getDate() - GRACIA_DIAS);

  // El primer aniversario cae un período después de la entrega, no en la
  // fecha de entrega misma — si no, un contrato recién creado calcula 0 días
  // hasta su "próxima" alza en vez de un período completo.
  const fecha = new Date(fechaEntregaIso);
  fecha.setMonth(fecha.getMonth() + meses);
  while (fecha <= limite) {
    fecha.setMonth(fecha.getMonth() + meses);
  }

  const dias = Math.round((fecha.getTime() - hoy.getTime()) / 86_400_000);
  const estado: EstadoAlza = dias < 0 ? 'vencido' : dias <= 30 ? 'proximo' : 'vigente';

  return { fechaIso: fecha.toISOString().slice(0, 10), dias, estado };
}

export const ESTADO_ALZA_LABELS: Record<EstadoAlza, string> = {
  vencido: 'Reajuste atrasado',
  proximo: 'Reajuste próximo',
  vigente: 'Reajuste vigente',
};

export function labelProximaAlza(alza: ProximaAlza): string {
  return `${ESTADO_ALZA_LABELS[alza.estado]}: ${formatFecha(alza.fechaIso)}`;
}
