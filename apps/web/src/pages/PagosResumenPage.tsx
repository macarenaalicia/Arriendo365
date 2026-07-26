import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type {
  ArriendoAuto,
  ArriendoPropiedad,
  Auto,
  CategoriaPago,
  EstadoPago,
  MantencionAuto,
  Pago,
  PagoVehiculo,
  ResumenPagos,
  TipoPagoVehiculo,
  TipoProveedor,
} from '../api/types';
import { ddmmyyyyToIso, formatFecha, formatMonto } from '../lib/format';
import { DateInput } from '../components/DateInput';
import { Modal } from '../components/Modal';
import { IconCheck, IconReloj, IconRechazar } from '../components/icons';
import {
  MEDIOS_PAGO,
  calcularEsAbono,
  clasificarTipoPago,
  TIPO_PAGO_CLASIFICADO_LABELS,
} from '../lib/periodos';

const ESTADO_LABELS: Record<EstadoPago, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  ATRASADO: 'Atrasado',
  RECHAZADO: 'Rechazado',
};

const ESTADOS_PAGO: EstadoPago[] = ['PENDIENTE', 'PAGADO', 'ATRASADO', 'RECHAZADO'];

type Aprobacion = 'aprobado' | 'rechazado' | 'pendiente';

const APROBACION_LABELS: Record<Aprobacion, string> = {
  aprobado: 'Aprobado',
  rechazado: 'Rechazado',
  pendiente: 'Pendiente',
};

const CATEGORIA_PAGO_LABELS: Record<CategoriaPago, string> = {
  ARRIENDO: 'Arriendo',
  SERVICIOS_BASICOS: 'Servicios básicos',
  GARANTIA: 'Garantía',
};

const TIPO_SERVICIO_LABELS: Record<TipoProveedor, string> = {
  AGUA: 'Agua',
  LUZ: 'Luz',
  GAS: 'Gas',
};

const FILTROS_COLUMNA_INICIAL = {
  arriendo: '',
  fechaPagoMes: '',
  periodoPagoMes: '',
  monto: '',
  tipo: '' as '' | 'completo' | 'abono',
  medioPago: '',
  categoria: '' as '' | CategoriaPago,
  aprobacion: '' as '' | Aprobacion,
};

type Vista = 'default' | 'todos' | 'pendientes' | 'mes';

const VISTA_LABELS: Record<Vista, string> = {
  default: 'Pendientes + mes actual',
  todos: 'Todos',
  pendientes: 'Solo pendientes de aprobación',
  mes: 'Solo mes actual',
};

function esMesActual(fechaIso: string): boolean {
  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  return fechaIso.slice(0, 7) === mesActual;
}

function labelMes(yyyyMm: string): string {
  const [year, month] = yyyyMm.split('-').map(Number);
  const nombre = new Date(year, month - 1, 1).toLocaleDateString('es-CL', {
    month: 'long',
    year: 'numeric',
  });
  return nombre.charAt(0).toUpperCase() + nombre.slice(1);
}

interface ReferenciaArriendo {
  label: string;
  link: string | null;
}

interface OpcionArriendo {
  key: string;
  arriendoTipo: 'propiedad' | 'auto';
  arriendoId: string;
  label: string;
  montoArriendo?: string;
}

const CREATE_FORM_INICIAL = {
  arriendoKey: '',
  periodo: '',
  fechaComprometida: '',
  monto: '',
  medioPago: '',
  tipoPago: 'completo' as 'completo' | 'abono',
  categoria: 'ARRIENDO' as CategoriaPago,
  tipoServicio: '' as TipoProveedor | '',
};

type TabPagos = 'propiedad' | 'servicios' | 'auto' | 'tag' | 'mantencion';

const TAB_LABELS: Record<TabPagos, string> = {
  propiedad: 'Propiedades',
  servicios: 'Servicios básicos',
  auto: 'Auto',
  tag: 'TAG',
  mantencion: 'Mantenciones',
};

const TIPO_PAGO_VEHICULO_LABELS: Record<TipoPagoVehiculo, string> = {
  SEGURO: 'Seguro',
  TAG: 'TAG',
  REVISION_TECNICA: 'Revisión técnica',
  PERMISO_CIRCULACION: 'Permiso de circulación',
  SOAP: 'SOAP',
  MULTA: 'Multa',
};

const MESES_LABELS = [
  'Ene',
  'Feb',
  'Mar',
  'Abr',
  'May',
  'Jun',
  'Jul',
  'Ago',
  'Sep',
  'Oct',
  'Nov',
  'Dic',
];

type EstadoCelda = 'pagado' | 'pendiente' | 'atrasado' | 'incompleto' | 'na';

const CELDA_CONFIG: Record<EstadoCelda, { clase: string; icono: React.ReactNode; titulo: string }> = {
  pagado: { clase: 'celda-pago--pagado', icono: <IconCheck />, titulo: 'Pagado' },
  pendiente: { clase: 'celda-pago--pendiente', icono: <IconReloj />, titulo: 'Pendiente (aún no vence)' },
  incompleto: { clase: 'celda-pago--incompleto', icono: '½', titulo: 'Incompleto (abono parcial)' },
  atrasado: { clase: 'celda-pago--atrasado', icono: <IconRechazar />, titulo: 'Atrasado' },
  na: { clase: 'celda-pago--na', icono: '—', titulo: 'No aplica este mes' },
};

/**
 * Estado de un mes de arriendo para la matriz simplificada. Se basa en si
 * hay pagos registrados ese mes (fechaComprometida), no en un campo
 * "atrasado" persistido — hoy nada marca eso automáticamente en la base.
 */
function calcularEstadoCelda(
  mesKey: string,
  fechaEntrega: string,
  montoArriendo: number,
  pagosDelArriendo: Pago[],
  hoy: Date,
  diaPago: number | null,
): EstadoCelda {
  const mesEntregaKey = fechaEntrega.slice(0, 7);
  const mesActualKey = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;

  if (mesKey < mesEntregaKey) return 'na';
  if (mesKey > mesActualKey) return 'na';

  const delMes = pagosDelArriendo.filter(
    (p) => p.fechaComprometida.slice(0, 7) === mesKey && p.estado !== 'RECHAZADO',
  );

  if (delMes.length === 0) {
    if (mesKey === mesActualKey) {
      return diaPago !== null && hoy.getDate() < diaPago ? 'pendiente' : 'atrasado';
    }
    return 'atrasado';
  }

  if (delMes.some((p) => p.aprobado === null)) return 'pendiente';

  const totalPagado = delMes.reduce((suma, p) => suma + Number(p.monto), 0);
  return totalPagado >= montoArriendo ? 'pagado' : 'incompleto';
}

interface FilaMatriz {
  key: string;
  label: string;
  link: string | null;
  fechaEntrega: string;
  montoArriendo: number;
  diaPago: number | null;
  pagos: Pago[];
}

export function PagosResumenPage() {
  const [resumen, setResumen] = useState<ResumenPagos | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [referencias, setReferencias] = useState<Record<string, ReferenciaArriendo>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [autos, setAutos] = useState<Auto[]>([]);
  const [pagosVehiculo, setPagosVehiculo] = useState<PagoVehiculo[]>([]);
  const [mantenciones, setMantenciones] = useState<MantencionAuto[]>([]);
  const [arriendosPropiedad, setArriendosPropiedad] = useState<ArriendoPropiedad[]>([]);
  const [arriendosAuto, setArriendosAuto] = useState<ArriendoAuto[]>([]);
  const [anioMatriz, setAnioMatriz] = useState(new Date().getFullYear());

  const [tabTipo, setTabTipo] = useState<TabPagos>('propiedad');
  const [vista, setVista] = useState<Vista>('default');
  const [filtroEstado, setFiltroEstado] = useState<EstadoPago | ''>('');
  const [filtrosCol, setFiltrosCol] = useState(FILTROS_COLUMNA_INICIAL);
  const [arriendosDisponibles, setArriendosDisponibles] = useState<OpcionArriendo[]>([]);

  const [showCreateForm, setShowCreateForm] = useState(false);
  const [createForm, setCreateForm] = useState(CREATE_FORM_INICIAL);
  const [createError, setCreateError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const hayFiltrosActivos =
    Boolean(filtroEstado) ||
    Object.values(filtrosCol).some((valor) => valor !== '');

  const limpiarFiltros = () => {
    setFiltroEstado('');
    setFiltrosCol(FILTROS_COLUMNA_INICIAL);
  };

  const cargarPagos = () => {
    api.get<Pago[]>('/pagos').then(setPagos);
  };

  useEffect(() => {
    Promise.all([
      api.get<ResumenPagos>('/pagos/resumen'),
      api.get<Pago[]>('/pagos'),
      api.get<ArriendoPropiedad[]>('/arriendos-propiedad'),
      api.get<ArriendoAuto[]>('/arriendos-auto'),
    ])
      .then(([resumenData, pagosData, arriendosPropiedad, arriendosAuto]) => {
        setResumen(resumenData);
        setPagos(pagosData);
        setArriendosPropiedad(arriendosPropiedad);
        setArriendosAuto(arriendosAuto);

        const mapa: Record<string, ReferenciaArriendo> = {};
        const opciones: OpcionArriendo[] = [];
        arriendosPropiedad.forEach((a) => {
          const label = `${a.propiedad.calle} ${a.propiedad.numero} — ${a.arrendatario.nombreCompleto}`;
          mapa[`propiedad-${a.id}`] = { label, link: `/arriendos/${a.id}` };
          opciones.push({
            key: `propiedad-${a.id}`,
            arriendoTipo: 'propiedad',
            arriendoId: a.id,
            label,
            montoArriendo: a.montoArriendo,
          });
        });
        arriendosAuto.forEach((a) => {
          const label = `${a.auto.patente} — ${a.arrendatario.nombreCompleto}`;
          mapa[`auto-${a.id}`] = { label, link: `/autos/${a.autoId}` };
          opciones.push({ key: `auto-${a.id}`, arriendoTipo: 'auto', arriendoId: a.id, label });
        });
        setReferencias(mapa);
        setArriendosDisponibles(opciones);
      })
      .catch(() => setError('No se pudo cargar el resumen de pagos'))
      .finally(() => setLoading(false));
  }, []);

  // TAG y Mantenciones (que incluye multas) viven en modelos aparte, sin
  // relación con Pago, y solo se listan por auto — para verlos todos juntos
  // acá hay que traer cada auto y agregar sus registros.
  useEffect(() => {
    api.get<Auto[]>('/autos').then((autosData) => {
      setAutos(autosData);
      Promise.all(autosData.map((a) => api.get<PagoVehiculo[]>(`/autos/${a.id}/pagos-vehiculo`))).then(
        (porAuto) => setPagosVehiculo(porAuto.flat()),
      );
      Promise.all(autosData.map((a) => api.get<MantencionAuto[]>(`/autos/${a.id}/mantenciones`))).then(
        (porAuto) => setMantenciones(porAuto.flat()),
      );
    });
  }, []);

  const cerrarCreacion = () => {
    setShowCreateForm(false);
    setCreateForm(CREATE_FORM_INICIAL);
    setCreateError(null);
  };

  const abrirCreacion = () => {
    setCreateForm(CREATE_FORM_INICIAL);
    setCreateError(null);
    setShowCreateForm(true);
  };

  const handleCrearPago = async (event: React.FormEvent) => {
    event.preventDefault();
    const opcion = arriendosDisponibles.find((o) => o.key === createForm.arriendoKey);
    if (!opcion) {
      setCreateError('Elige a qué arriendo corresponde.');
      return;
    }

    const periodo = ddmmyyyyToIso(createForm.periodo);
    const fechaComprometida = ddmmyyyyToIso(createForm.fechaComprometida);
    if (!periodo || !fechaComprometida) {
      setCreateError('Revisa las fechas, deben tener el formato dd/mm/aaaa.');
      return;
    }
    if (createForm.categoria === 'ARRIENDO' && !createForm.medioPago) {
      setCreateError('Elige el medio de pago.');
      return;
    }
    if (createForm.categoria === 'SERVICIOS_BASICOS' && !createForm.tipoServicio) {
      setCreateError('Elige a qué servicio corresponde el pago.');
      return;
    }

    setCreateError(null);
    setCreating(true);
    try {
      await api.post('/pagos', {
        arriendoTipo: opcion.arriendoTipo,
        arriendoId: opcion.arriendoId,
        periodo,
        fechaComprometida,
        monto: Number(createForm.monto),
        medioPago: createForm.categoria === 'ARRIENDO' ? createForm.medioPago : undefined,
        esAbono:
          createForm.categoria === 'ARRIENDO' && opcion.montoArriendo
            ? calcularEsAbono(
                Number(createForm.monto),
                Number(opcion.montoArriendo),
                pagos.filter(
                  (p) =>
                    p.arriendoTipo === opcion.arriendoTipo &&
                    p.arriendoId === opcion.arriendoId &&
                    p.categoria === 'ARRIENDO' &&
                    p.fechaComprometida.slice(0, 7) === fechaComprometida.slice(0, 7),
                ),
              )
            : createForm.tipoPago === 'abono',
        categoria: createForm.categoria,
        tipoServicio:
          createForm.categoria === 'SERVICIOS_BASICOS' ? createForm.tipoServicio : undefined,
      });
      cerrarCreacion();
      cargarPagos();
    } catch (err) {
      setCreateError(err instanceof ApiError ? err.message : 'No se pudo registrar el pago');
    } finally {
      setCreating(false);
    }
  };

  const handleAprobar = async (pagoId: string) => {
    await api.patch(`/pagos/${pagoId}`, { aprobado: true, estado: 'PAGADO' });
    cargarPagos();
  };

  const handleRechazar = async (pagoId: string) => {
    const motivoRechazo = prompt('Motivo del rechazo:');
    if (motivoRechazo === null) return;
    if (!motivoRechazo.trim()) {
      alert('Debes indicar un motivo de rechazo.');
      return;
    }
    await api.patch(`/pagos/${pagoId}`, {
      aprobado: false,
      estado: 'RECHAZADO',
      motivoRechazo: motivoRechazo.trim(),
    });
    cargarPagos();
  };

  if (loading) return <p>Cargando…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!resumen) return null;

  const opcionSeleccionada = arriendosDisponibles.find((o) => o.key === createForm.arriendoKey);
  const mostrarTipoPagoManual =
    createForm.categoria === 'SERVICIOS_BASICOS' || !opcionSeleccionada?.montoArriendo;

  const arriendoLabel = (pago: Pago) =>
    referencias[`${pago.arriendoTipo}-${pago.arriendoId}`]?.label ?? '—';

  const autoLabel = (autoId: string) => autos.find((a) => a.id === autoId)?.patente ?? '—';

  const esTabPago = tabTipo === 'propiedad' || tabTipo === 'servicios' || tabTipo === 'auto';

  const pagosTab = !esTabPago
    ? []
    : pagos.filter((p) => {
        if (tabTipo === 'servicios') return p.categoria === 'SERVICIOS_BASICOS';
        if (tabTipo === 'propiedad') return p.arriendoTipo === 'propiedad' && p.categoria !== 'SERVICIOS_BASICOS';
        return p.arriendoTipo === 'auto';
      });

  const tagPagos = pagosVehiculo
    .filter((p) => p.tipo === 'TAG')
    .sort((a, b) => b.fechaPago.localeCompare(a.fechaPago));

  const mantencionesTab = [...mantenciones].sort((a, b) =>
    b.fechaMantencion.localeCompare(a.fechaMantencion),
  );
  const multasYOtros = pagosVehiculo
    .filter((p) => p.tipo !== 'TAG')
    .sort((a, b) => b.fechaPago.localeCompare(a.fechaPago));

  const mostrarMatriz = tabTipo === 'propiedad' || tabTipo === 'auto';

  const filasMatriz: FilaMatriz[] = !mostrarMatriz
    ? []
    : tabTipo === 'propiedad'
      ? arriendosPropiedad
          .filter((a) => a.estado === 'ACTIVO')
          .map((a) => {
            const label = `${a.propiedad.calle} ${a.propiedad.numero} — ${a.arrendatario.nombreCompleto}`;
            return {
              key: `propiedad-${a.id}`,
              label,
              link: `/arriendos/${a.id}`,
              fechaEntrega: a.fechaEntrega,
              montoArriendo: Number(a.montoArriendo),
              diaPago: a.fechaPago,
              pagos: pagos.filter(
                (p) => p.arriendoTipo === 'propiedad' && p.arriendoId === a.id && p.categoria === 'ARRIENDO',
              ),
            };
          })
      : arriendosAuto
          .filter((a) => a.estado === 'ACTIVO')
          .map((a) => ({
            key: `auto-${a.id}`,
            label: `${a.auto.patente} — ${a.arrendatario.nombreCompleto}`,
            link: `/autos/${a.autoId}`,
            fechaEntrega: a.fechaEntrega,
            montoArriendo: Number(a.montoArriendo),
            diaPago: null,
            pagos: pagos.filter(
              (p) => p.arriendoTipo === 'auto' && p.arriendoId === a.id && p.categoria === 'ARRIENDO',
            ),
          }));

  const mesesMatriz = Array.from({ length: 12 }, (_, i) => {
    const key = `${anioMatriz}-${String(i + 1).padStart(2, '0')}`;
    return { key, label: MESES_LABELS[i] };
  });

  const hoy = new Date();

  const handleClickCelda = (fila: FilaMatriz, mesKey: string) => {
    setVista('todos');
    setFiltrosCol({ ...FILTROS_COLUMNA_INICIAL, arriendo: fila.label, periodoPagoMes: mesKey });
  };

  const resumenTab = ESTADOS_PAGO.reduce(
    (acc, estado) => {
      const delEstado = pagosTab.filter((p) => p.estado === estado);
      acc[estado] = {
        cantidad: delEstado.length,
        montoTotal: delEstado.reduce((suma, p) => suma + Number(p.monto), 0),
      };
      return acc;
    },
    {} as Record<EstadoPago, { cantidad: number; montoTotal: number }>,
  );

  // Opciones "al estilo Excel": solo lo que realmente aparece en los pagos
  // cargados, no un universo fijo — así el filtro siempre tiene sentido.
  const opcionesArriendo = Array.from(new Set(pagosTab.map(arriendoLabel))).sort((a, b) =>
    a.localeCompare(b, 'es'),
  );
  const opcionesMonto = Array.from(new Set(pagosTab.map((p) => formatMonto(p.monto)))).sort(
    (a, b) => Number(a.replace(/\D/g, '')) - Number(b.replace(/\D/g, '')),
  );
  const opcionesFechaPago = Array.from(new Set(pagosTab.map((p) => p.periodo.slice(0, 7))))
    .sort()
    .reverse();
  const opcionesPeriodoPago = Array.from(
    new Set(pagosTab.map((p) => p.fechaComprometida.slice(0, 7))),
  )
    .sort()
    .reverse();
  const opcionesMedioPago = Array.from(
    new Set(pagosTab.map((p) => p.medioPago).filter((m): m is string => Boolean(m))),
  ).sort((a, b) => a.localeCompare(b, 'es'));

  const pagosFiltrados = pagosTab
    .filter((pago) => {
      if (filtroEstado && pago.estado !== filtroEstado) return false;
      if (vista === 'pendientes') return pago.aprobado === null;
      if (vista === 'mes') return esMesActual(pago.periodo);
      if (vista === 'todos') return true;
      return pago.aprobado === null || esMesActual(pago.periodo);
    })
    .filter((pago) => {
      const aprobacion: Aprobacion =
        pago.aprobado === true ? 'aprobado' : pago.aprobado === false ? 'rechazado' : 'pendiente';

      if (filtrosCol.arriendo && arriendoLabel(pago) !== filtrosCol.arriendo) return false;
      if (filtrosCol.fechaPagoMes && pago.periodo.slice(0, 7) !== filtrosCol.fechaPagoMes)
        return false;
      if (
        filtrosCol.periodoPagoMes &&
        pago.fechaComprometida.slice(0, 7) !== filtrosCol.periodoPagoMes
      )
        return false;
      if (filtrosCol.monto && formatMonto(pago.monto) !== filtrosCol.monto) return false;
      if (filtrosCol.tipo && (pago.esAbono ? 'abono' : 'completo') !== filtrosCol.tipo) return false;
      if (filtrosCol.medioPago && pago.medioPago !== filtrosCol.medioPago) return false;
      if (filtrosCol.categoria && pago.categoria !== filtrosCol.categoria) return false;
      if (filtrosCol.aprobacion && aprobacion !== filtrosCol.aprobacion) return false;
      return true;
    })
    .sort((a, b) => b.periodo.localeCompare(a.periodo));

  return (
    <div>
      <h1>Resumen de pagos</h1>

      <div className="tabs">
        {(Object.keys(TAB_LABELS) as TabPagos[]).map((tab) => (
          <button
            key={tab}
            type="button"
            className={`tabs__button${tabTipo === tab ? ' tabs__button--active' : ''}`}
            onClick={() => setTabTipo(tab)}
          >
            {TAB_LABELS[tab]}
          </button>
        ))}
      </div>

      {mostrarMatriz && (
        <section>
          <div className="page-header">
            <h2>Vista rápida por mes</h2>
            <div className="page-header__actions">
              <select
                value={anioMatriz}
                onChange={(e) => setAnioMatriz(Number(e.target.value))}
              >
                {[hoy.getFullYear(), hoy.getFullYear() - 1, hoy.getFullYear() - 2].map((anio) => (
                  <option key={anio} value={anio}>
                    {anio}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {filasMatriz.length === 0 ? (
            <p className="empty-state">Sin arriendos activos.</p>
          ) : (
            <>
              <div className="matriz-pagos">
                <table>
                  <thead>
                    <tr>
                      <th>{tabTipo === 'propiedad' ? 'Propiedad' : 'Auto'}</th>
                      {mesesMatriz.map((mes) => (
                        <th key={mes.key}>{mes.label}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {filasMatriz.map((fila) => (
                      <tr key={fila.key}>
                        <td>{fila.link ? <Link to={fila.link}>{fila.label}</Link> : fila.label}</td>
                        {mesesMatriz.map((mes) => {
                          const estadoCelda = calcularEstadoCelda(
                            mes.key,
                            fila.fechaEntrega,
                            fila.montoArriendo,
                            fila.pagos,
                            hoy,
                            fila.diaPago,
                          );
                          const config = CELDA_CONFIG[estadoCelda];
                          const esNa = estadoCelda === 'na';
                          return (
                            <td key={mes.key}>
                              <button
                                type="button"
                                className={`celda-pago ${config.clase}`}
                                title={config.titulo}
                                aria-label={`${fila.label}, ${mes.label}: ${config.titulo}`}
                                disabled={esNa}
                                onClick={() => handleClickCelda(fila, mes.key)}
                              >
                                {config.icono}
                              </button>
                            </td>
                          );
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="matriz-pagos__leyenda">
                {(Object.keys(CELDA_CONFIG) as EstadoCelda[])
                  .filter((estado) => estado !== 'na')
                  .map((estado) => (
                    <span key={estado}>
                      <span className={`celda-pago ${CELDA_CONFIG[estado].clase}`}>
                        {CELDA_CONFIG[estado].icono}
                      </span>
                      {CELDA_CONFIG[estado].titulo}
                    </span>
                  ))}
              </div>
              <p className="empty-state">Haz clic en un ícono para ver el detalle de ese mes abajo.</p>
            </>
          )}
        </section>
      )}

      {esTabPago && (
        <div className="stat-grid">
          {(Object.entries(resumenTab) as [EstadoPago, { cantidad: number; montoTotal: number }][]).map(
            ([estado, datos]) => (
              <div key={estado} className={`stat-card stat-card--${estado.toLowerCase()}`}>
                <span className="stat-card__label">{ESTADO_LABELS[estado]}</span>
                <span className="stat-card__value">{formatMonto(datos.montoTotal)}</span>
                <span className="stat-card__count">{datos.cantidad} pago(s)</span>
              </div>
            ),
          )}
        </div>
      )}

      {tabTipo === 'tag' && (
        <section>
          <h2>TAG</h2>
          {tagPagos.length === 0 ? (
            <p className="empty-state">Sin cobros de TAG registrados.</p>
          ) : (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Auto</th>
                    <th>Autopista</th>
                    <th>N° boleta</th>
                    <th>Fecha</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {tagPagos.map((p) => (
                    <tr key={p.id}>
                      <td>
                        <Link to={`/autos/${p.autoId}`}>{autoLabel(p.autoId)}</Link>
                      </td>
                      <td>{p.autopista ?? '—'}</td>
                      <td>{p.numeroBoleta ?? '—'}</td>
                      <td>{formatFecha(p.fechaPago)}</td>
                      <td>{formatMonto(p.monto)}</td>
                      <td>
                        <span className={`badge badge--${p.estado.toLowerCase()}`}>{p.estado}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      )}

      {tabTipo === 'mantencion' && (
        <>
          <section>
            <h2>Mantenciones</h2>
            {mantencionesTab.length === 0 ? (
              <p className="empty-state">Sin mantenciones registradas.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Auto</th>
                      <th>Tipos</th>
                      <th>Fecha</th>
                      <th>Costo</th>
                      <th>Quién paga</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mantencionesTab.map((m) => (
                      <tr key={m.id}>
                        <td>
                          <Link to={`/autos/${m.autoId}`}>{autoLabel(m.autoId)}</Link>
                        </td>
                        <td>{m.items.map((i) => i.configuracion.tipo).join(', ')}</td>
                        <td>{formatFecha(m.fechaMantencion)}</td>
                        <td>{m.costo !== null ? formatMonto(m.costo) : '—'}</td>
                        <td>{m.quienPago ?? '—'}</td>
                        <td>
                          <span className={`badge badge--${m.estadoPago.toLowerCase()}`}>
                            {m.estadoPago}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>

          <section>
            <h2>Multas y otros</h2>
            {multasYOtros.length === 0 ? (
              <p className="empty-state">Sin multas u otros cobros registrados.</p>
            ) : (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Auto</th>
                      <th>Tipo</th>
                      <th>Fecha</th>
                      <th>Monto</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    {multasYOtros.map((p) => (
                      <tr key={p.id}>
                        <td>
                          <Link to={`/autos/${p.autoId}`}>{autoLabel(p.autoId)}</Link>
                        </td>
                        <td>{TIPO_PAGO_VEHICULO_LABELS[p.tipo]}</td>
                        <td>{formatFecha(p.fechaPago)}</td>
                        <td>{formatMonto(p.monto)}</td>
                        <td>
                          <span className={`badge badge--${p.estado.toLowerCase()}`}>{p.estado}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      )}

      {esTabPago && (
      <section>
        <div className="page-header">
          <h2>Pagos registrados</h2>
          <div className="page-header__actions">
            <select value={vista} onChange={(e) => setVista(e.target.value as Vista)}>
              {(Object.keys(VISTA_LABELS) as Vista[]).map((v) => (
                <option key={v} value={v}>
                  {VISTA_LABELS[v]}
                </option>
              ))}
            </select>
            {hayFiltrosActivos && (
              <button type="button" className="link-button" onClick={limpiarFiltros}>
                Limpiar filtros
              </button>
            )}
            <button type="button" onClick={abrirCreacion}>
              + Nuevo pago
            </button>
          </div>
        </div>

        {showCreateForm && (
          <Modal titulo="Nuevo pago" onClose={cerrarCreacion}>
            <form className="inline-form" onSubmit={handleCrearPago}>
              <div className="inline-form__grid">
                <label>
                  Arriendo
                  <select
                    required
                    value={createForm.arriendoKey}
                    onChange={(e) => setCreateForm({ ...createForm, arriendoKey: e.target.value })}
                  >
                    <option value="">Elige un arriendo…</option>
                    {arriendosDisponibles
                      .filter((o) => o.arriendoTipo === tabTipo)
                      .map((o) => (
                      <option key={o.key} value={o.key}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Categoría
                  <select
                    value={createForm.categoria}
                    onChange={(e) =>
                      setCreateForm({ ...createForm, categoria: e.target.value as CategoriaPago })
                    }
                  >
                    {(Object.keys(CATEGORIA_PAGO_LABELS) as CategoriaPago[]).map((c) => (
                      <option key={c} value={c}>
                        {CATEGORIA_PAGO_LABELS[c]}
                      </option>
                    ))}
                  </select>
                </label>
                {createForm.categoria === 'SERVICIOS_BASICOS' && (
                  <label>
                    Servicio
                    <select
                      required
                      value={createForm.tipoServicio}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          tipoServicio: e.target.value as TipoProveedor,
                        })
                      }
                    >
                      <option value="">Elige un servicio…</option>
                      {(Object.keys(TIPO_SERVICIO_LABELS) as TipoProveedor[]).map((tipo) => (
                        <option key={tipo} value={tipo}>
                          {TIPO_SERVICIO_LABELS[tipo]}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
                <label>
                  Fecha de pago
                  <DateInput
                    value={createForm.periodo}
                    onChange={(value) => setCreateForm({ ...createForm, periodo: value })}
                    required
                  />
                </label>
                <label>
                  Periodo de pago
                  <DateInput
                    value={createForm.fechaComprometida}
                    onChange={(value) =>
                      setCreateForm({ ...createForm, fechaComprometida: value })
                    }
                    required
                  />
                </label>
                {mostrarTipoPagoManual && (
                  <label>
                    Tipo de pago
                    <select
                      value={createForm.tipoPago}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          tipoPago: e.target.value as typeof createForm.tipoPago,
                        })
                      }
                    >
                      <option value="completo">Pago completo</option>
                      <option value="abono">Abono</option>
                    </select>
                  </label>
                )}
                <label>
                  Monto
                  <input
                    type="number"
                    min={0}
                    required
                    value={createForm.monto}
                    onChange={(e) => setCreateForm({ ...createForm, monto: e.target.value })}
                  />
                </label>
                {createForm.categoria === 'ARRIENDO' && (
                  <label>
                    Medio de pago
                    <select
                      required
                      value={createForm.medioPago}
                      onChange={(e) =>
                        setCreateForm({ ...createForm, medioPago: e.target.value })
                      }
                    >
                      <option value="">Selecciona…</option>
                      {MEDIOS_PAGO.map((medio) => (
                        <option key={medio} value={medio}>
                          {medio}
                        </option>
                      ))}
                    </select>
                  </label>
                )}
              </div>

              {createError && <p className="auth-card__error">{createError}</p>}

              <button type="submit" disabled={creating}>
                {creating ? 'Guardando…' : 'Registrar'}
              </button>
            </form>
          </Modal>
        )}

        {pagos.length === 0 ? (
          <p className="empty-state">Sin pagos registrados.</p>
        ) : (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Arriendo</th>
                  <th>Fecha de pago</th>
                  <th>Periodo de pago</th>
                  <th>Monto</th>
                  <th>Tipo</th>
                  <th>Medio de pago</th>
                  <th>Categoría</th>
                  <th>Estado</th>
                  <th>Revisión</th>
                </tr>
                <tr className="table__filter-row">
                  <th>
                    <select
                      value={filtrosCol.arriendo}
                      onChange={(e) => setFiltrosCol({ ...filtrosCol, arriendo: e.target.value })}
                    >
                      <option value="">Todos</option>
                      {opcionesArriendo.map((label) => (
                        <option key={label} value={label}>
                          {label}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filtrosCol.fechaPagoMes}
                      onChange={(e) => setFiltrosCol({ ...filtrosCol, fechaPagoMes: e.target.value })}
                    >
                      <option value="">Todos</option>
                      {opcionesFechaPago.map((mes) => (
                        <option key={mes} value={mes}>
                          {labelMes(mes)}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filtrosCol.periodoPagoMes}
                      onChange={(e) =>
                        setFiltrosCol({ ...filtrosCol, periodoPagoMes: e.target.value })
                      }
                    >
                      <option value="">Todos</option>
                      {opcionesPeriodoPago.map((mes) => (
                        <option key={mes} value={mes}>
                          {labelMes(mes)}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filtrosCol.monto}
                      onChange={(e) => setFiltrosCol({ ...filtrosCol, monto: e.target.value })}
                    >
                      <option value="">Todos</option>
                      {opcionesMonto.map((monto) => (
                        <option key={monto} value={monto}>
                          {monto}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filtrosCol.tipo}
                      onChange={(e) =>
                        setFiltrosCol({ ...filtrosCol, tipo: e.target.value as typeof filtrosCol.tipo })
                      }
                    >
                      <option value="">Todos</option>
                      <option value="completo">Completo</option>
                      <option value="abono">Abono</option>
                    </select>
                  </th>
                  <th>
                    <select
                      value={filtrosCol.medioPago}
                      onChange={(e) => setFiltrosCol({ ...filtrosCol, medioPago: e.target.value })}
                    >
                      <option value="">Todos</option>
                      {opcionesMedioPago.map((medio) => (
                        <option key={medio} value={medio}>
                          {medio}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filtrosCol.categoria}
                      onChange={(e) =>
                        setFiltrosCol({
                          ...filtrosCol,
                          categoria: e.target.value as typeof filtrosCol.categoria,
                        })
                      }
                    >
                      <option value="">Todos</option>
                      {(Object.keys(CATEGORIA_PAGO_LABELS) as CategoriaPago[]).map((c) => (
                        <option key={c} value={c}>
                          {CATEGORIA_PAGO_LABELS[c]}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filtroEstado}
                      onChange={(e) => setFiltroEstado(e.target.value as EstadoPago | '')}
                    >
                      <option value="">Todos</option>
                      {ESTADOS_PAGO.map((estado) => (
                        <option key={estado} value={estado}>
                          {ESTADO_LABELS[estado]}
                        </option>
                      ))}
                    </select>
                  </th>
                  <th>
                    <select
                      value={filtrosCol.aprobacion}
                      onChange={(e) =>
                        setFiltrosCol({
                          ...filtrosCol,
                          aprobacion: e.target.value as typeof filtrosCol.aprobacion,
                        })
                      }
                    >
                      <option value="">Todos</option>
                      {(Object.keys(APROBACION_LABELS) as Aprobacion[]).map((key) => (
                        <option key={key} value={key}>
                          {APROBACION_LABELS[key]}
                        </option>
                      ))}
                    </select>
                  </th>
                </tr>
              </thead>
              <tbody>
                {pagosFiltrados.length === 0 && (
                  <tr>
                    <td colSpan={9} className="empty-state">
                      No hay pagos que coincidan con este filtro.
                    </td>
                  </tr>
                )}
                {pagosFiltrados.map((pago) => {
                  const ref = referencias[`${pago.arriendoTipo}-${pago.arriendoId}`];
                  return (
                    <tr key={pago.id}>
                      <td>
                        {ref?.link ? (
                          <Link to={ref.link}>{ref.label}</Link>
                        ) : (
                          (ref?.label ?? '—')
                        )}
                      </td>
                      <td>{formatFecha(pago.periodo)}</td>
                      <td>{formatFecha(pago.fechaComprometida)}</td>
                      <td>{formatMonto(pago.monto)}</td>
                      <td>
                        {(() => {
                          const tipo = clasificarTipoPago(
                            pago,
                            pagos.filter(
                              (p) =>
                                p.arriendoTipo === pago.arriendoTipo &&
                                p.arriendoId === pago.arriendoId &&
                                p.categoria === pago.categoria &&
                                p.fechaComprometida.slice(0, 7) ===
                                  pago.fechaComprometida.slice(0, 7),
                            ),
                          );
                          return (
                            <span className={`badge badge--${tipo}`}>
                              {TIPO_PAGO_CLASIFICADO_LABELS[tipo]}
                            </span>
                          );
                        })()}
                      </td>
                      <td>{pago.medioPago ?? ''}</td>
                      <td>
                        {CATEGORIA_PAGO_LABELS[pago.categoria]}
                        {pago.tipoServicio ? ` · ${TIPO_SERVICIO_LABELS[pago.tipoServicio]}` : ''}
                      </td>
                      <td>
                        <span className={`badge badge--${pago.estado.toLowerCase()}`}>
                          {pago.estado}
                        </span>
                      </td>
                      <td>
                        {pago.aprobado !== null && (
                          <div>
                            <span className="icono-revision icono-revision--aprobado" title="Revisado">
                              <IconCheck />
                            </span>
                            {pago.aprobado === false && pago.motivoRechazo && (
                              <p className="table__note">{pago.motivoRechazo}</p>
                            )}
                          </div>
                        )}
                        {pago.aprobado === null && (
                          <div className="table__actions">
                            <span
                              className="icono-revision icono-revision--pendiente"
                              title="Pendiente"
                            >
                              <IconReloj />
                            </span>
                            <button type="button" onClick={() => handleAprobar(pago.id)}>
                              Aprobar
                            </button>
                            <button
                              type="button"
                              className="danger"
                              onClick={() => handleRechazar(pago.id)}
                            >
                              Rechazar
                            </button>
                          </div>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      )}
    </div>
  );
}
