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
  precioArriendoEsperado: string | null;
}

export interface Foto {
  id: string;
  archivoUrl: string;
  descripcion: string | null;
}

export interface Documento {
  id: string;
  tipo: string;
  archivoUrl: string;
  fechaEmision: string | null;
  fechaVencimiento: string | null;
}

export interface PropiedadPublica {
  id: string;
  tipo: TipoPropiedad;
  calle: string;
  numero: string;
  numeroDepartamento: string | null;
  sector: string | null;
  ciudad: string;
  region: string;
  nHabitaciones: number;
  nBanos: number;
  bodega: boolean;
  estacionamiento: boolean;
  mt2Totales: string;
  mt2Construidos: string;
  descripcion: string | null;
  precioArriendoEsperado: string | null;
  fotos: Foto[];
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
  marca: string | null;
  modelo: string | null;
  anio: number | null;
  kilometraje: number;
  padronDocId: string | null;
  estado: EstadoAuto;
}

export type TipoPagoVehiculo =
  | 'SEGURO'
  | 'TAG'
  | 'REVISION_TECNICA'
  | 'PERMISO_CIRCULACION'
  | 'SOAP'
  | 'MULTA';

export type Periodicidad = 'MENSUAL' | 'TRIMESTRAL' | 'SEMESTRAL' | 'ANUAL';

export const AUTOPISTAS_TAG = [
  'Autopase',
  'Conopsa',
  'Costanera Norte',
  'Ruta Pass',
  'Vespucio Sur',
] as const;

export interface PagoVehiculo {
  id: string;
  autoId: string;
  tipo: TipoPagoVehiculo;
  autopista: string | null;
  numeroBoleta: string | null;
  periodicidad: Periodicidad;
  conCredito: boolean;
  cuotas: number | null;
  montoCuota: string | null;
  monto: string;
  fechaPago: string;
  comprobanteFotoId: string | null;
  pagado: boolean;
  montoPagado: string;
  esAbono: boolean;
  abonoId: string | null;
  estado: EstadoPago;
  fechaPagoReal: string | null;
}

export interface Persona {
  id: string;
  nombreCompleto: string;
  /** Un técnico (tipoPersona TECNICO) no exige RUT, solo nombre completo. */
  rut: string | null;
  /** Categoriza a la persona (ej. técnico) independiente de si tiene acceso a la plataforma. */
  tipoPersona: RolUsuario | null;
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

export type QuienPago = 'PROPIETARIO' | 'ARRENDATARIO';

export interface MantencionAuto {
  id: string;
  autoId: string;
  kilometrajeActual: number;
  kilometrajeProxima: number | null;
  fechaMantencion: string;
  costo: string | null;
  quienPago: QuienPago | null;
  estadoPago: EstadoPago;
  aprobado: boolean | null;
  motivoRechazo: string | null;
  items: MantencionAutoItem[];
}

export type PeriodoPagoAuto = 'SEMANAL' | 'DOS_SEMANAS' | 'MENSUAL';

export const PERIODOS_PAGO_AUTO_LABELS: Record<PeriodoPagoAuto, string> = {
  SEMANAL: '1 semana',
  DOS_SEMANAS: '2 semanas',
  MENSUAL: 'Mensual',
};

export interface ArriendoAuto {
  id: string;
  autoId: string;
  arrendatarioId: string;
  kilometrajeEntrega: number;
  kilometrajeRecepcion: number | null;
  contratoDocId: string | null;
  periodoPago: PeriodoPagoAuto;
  fechaEntrega: string;
  periodoAlza: string;
  montoArriendo: string;
  estado: EstadoArriendo;
  arrendatario: Persona;
  auto: Auto;
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
  /** Solo viene informado para el arrendatario que consulta su propio arriendo. */
  arrendador?: Persona | null;
}

export type CategoriaPago = 'ARRIENDO' | 'SERVICIOS_BASICOS' | 'GARANTIA';

export interface Pago {
  id: string;
  arriendoTipo: 'propiedad' | 'auto';
  arriendoId: string;
  periodo: string;
  fechaComprometida: string;
  periodoHasta: string | null;
  kilometraje: number | null;
  fechaPagoReal: string | null;
  monto: string;
  medioPago: string | null;
  esAbono: boolean;
  estado: EstadoPago;
  categoria: CategoriaPago;
  tipoServicio: TipoProveedor | null;
  aprobado: boolean | null;
  motivoRechazo: string | null;
  createdAt: string;
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
  | 'RESUELTO'
  | 'RECHAZADO'
  | 'REABIERTO';

export type TipoReparacion = 'ESTRUCTURAL' | 'LOCATIVA';

export interface RequerimientoActualizacion {
  id: string;
  urgencia: UrgenciaRequerimiento;
  estado: EstadoRequerimiento;
  tipoReparacion: TipoReparacion;
  tecnico: Persona | null;
  notasArrendatario: string | null;
  detalleResolucion: string | null;
  nota: string | null;
  usuario: { persona: Persona } | null;
  createdAt: string;
}

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
  actualizaciones: RequerimientoActualizacion[];
}
