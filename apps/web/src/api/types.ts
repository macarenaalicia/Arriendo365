export type RolUsuario = 'ADMINISTRADOR' | 'PROPIETARIO' | 'ARRENDATARIO' | 'TECNICO';

export type EstadoArriendo = 'ACTIVO' | 'INACTIVO' | 'TERMINADO';

export type EstadoPago = 'PENDIENTE' | 'PAGADO' | 'ATRASADO' | 'RECHAZADO';

export interface Propiedad {
  id: string;
  rol: string;
  calle: string;
  numero: string;
  sector: string | null;
  ciudad: string;
  region: string;
  tipo: string;
  nHabitaciones: number;
  nBanos: number;
  estado: string;
}

export interface Persona {
  id: string;
  nombreCompleto: string;
  rut: string;
  email: string | null;
  telefono: string | null;
}

export interface ArriendoPropiedad {
  id: string;
  propiedadId: string;
  arrendatarioId: string;
  codeudorId: string | null;
  fechaPago: number;
  fechaEntrega: string;
  fechaRecepcion: string | null;
  periodoAlza: string;
  montoArriendo: string;
  estado: EstadoArriendo;
  propiedad: Propiedad;
  arrendatario: Persona;
  codeudor: Persona | null;
}

export interface Pago {
  id: string;
  arriendoTipo: 'propiedad' | 'auto';
  arriendoId: string;
  periodo: string;
  fechaComprometida: string;
  fechaPagoReal: string | null;
  monto: string;
  medioPago: string | null;
  estado: EstadoPago;
  aprobado: boolean | null;
}

export interface ResumenPagos {
  porEstado: Record<EstadoPago, { cantidad: number; montoTotal: number }>;
  montoTotalGeneral: number;
}
