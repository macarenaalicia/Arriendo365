export type RolUsuario = 'ADMINISTRADOR' | 'PROPIETARIO' | 'ARRENDATARIO' | 'TECNICO';

export type EstadoArriendo = 'ACTIVO' | 'INACTIVO' | 'TERMINADO';

export type EstadoPago = 'PENDIENTE' | 'PAGADO' | 'ATRASADO' | 'RECHAZADO';

export type TipoPropiedad = 'CASA' | 'DEPARTAMENTO' | 'HABITACION' | 'TERRENO';

export type EstadoPropiedad = 'DISPONIBLE' | 'ARRENDADA' | 'EN_MANTENCION' | 'USUFRUCTO';

export type EstadoAuto = 'DISPONIBLE' | 'ARRENDADO' | 'EN_MANTENCION';

export type TipoProveedor = 'AGUA' | 'LUZ' | 'GAS';

export type EstadoProveedor = 'ACTIVO' | 'INACTIVO';

export const EMPRESAS_POR_TIPO_PROVEEDOR: Record<TipoProveedor, string[]> = {
  LUZ: ['Chilquinta Energía', 'CGE'],
  AGUA: ['Esval', 'APR (Agua Potable Rural)'],
  GAS: ['GasValpo', 'Gasco', 'Abastible', 'Lipigas'],
};

export interface Propiedad {
  id: string;
  rol: string;
  calle: string;
  numero: string;
  numeroDepartamento: string | null;
  sector: string | null;
  ciudad: string;
  region: string;
  tipo: TipoPropiedad;
  nHabitaciones: number;
  nBanos: number;
  bodega: boolean;
  bodegaNumero: string | null;
  estacionamiento: boolean;
  estacionamientoNumero: string | null;
  mt2Totales: string;
  mt2Construidos: string;
  descripcion: string | null;
  estado: EstadoPropiedad;
  pagaContribuciones: boolean;
}

export interface Proveedor {
  id: string;
  propiedadId: string;
  tipo: TipoProveedor;
  empresa: string;
  nCliente: string;
  estado: EstadoProveedor;
}

export interface Auto {
  id: string;
  patente: string;
  kilometraje: number;
  padronDocId: string | null;
  estado: EstadoAuto;
}

export interface Persona {
  id: string;
  nombreCompleto: string;
  rut: string;
  email: string | null;
  telefono: string | null;
  direccion: string | null;
  fechaNacimiento: string | null;
}

export interface Usuario {
  id: string;
  personaId: string;
  rol: RolUsuario;
  activo: boolean;
}

export interface ConfiguracionMantencion {
  id: string;
  tipo: string;
  cadaKm: number;
}

export interface MantencionAutoItem {
  id: string;
  configuracionId: string;
  configuracion: ConfiguracionMantencion;
}

export interface MantencionAuto {
  id: string;
  autoId: string;
  kilometrajeActual: number;
  kilometrajeProxima: number | null;
  fechaMantencion: string;
  items: MantencionAutoItem[];
}

export interface ArriendoAuto {
  id: string;
  autoId: string;
  arrendatarioId: string;
  kilometrajeEntrega: number;
  kilometrajeRecepcion: number | null;
  contratoDocId: string | null;
  estado: EstadoArriendo;
  arrendatario: Persona;
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

export type UrgenciaRequerimiento = 'CRITICA' | 'MEDIA' | 'BAJA';

export type EstadoRequerimiento =
  | 'PENDIENTE_REVISION'
  | 'REVISION_AGENDADA'
  | 'EN_REVISION'
  | 'RESUELTO';

export type TipoReparacion = 'ESTRUCTURAL' | 'LOCATIVA';

export interface Requerimiento {
  id: string;
  arriendoPropiedadId: string;
  urgencia: UrgenciaRequerimiento;
  estado: EstadoRequerimiento;
  tecnicoId: string | null;
  tecnico: Persona | null;
  tipoReparacion: TipoReparacion;
  detalleResolucion: string | null;
  notasInternas: string | null;
  notasArrendatario: string | null;
  fechaComprometida: string | null;
  fechaSolucion: string | null;
}
