import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type {
  ArriendoAuto,
  ArriendoPropiedad,
  CategoriaPago,
  ConfiguracionMantencion,
  EstadoPago,
  MantencionAuto,
  Pago,
  TipoProveedor,
} from '../api/types';
import { ddmmyyyyToIso, formatFecha, formatMonto, hoyDdmmyyyy } from '../lib/format';
import { DateInput } from '../components/DateInput';
import { Modal } from '../components/Modal';
import { IconCheck, IconReloj } from '../components/icons';
import {
  MEDIOS_PAGO,
  calcularEsAbono,
  clasificarTipoPago,
  generarOpcionesPeriodo,
  periodoValorAFecha,
  TIPO_PAGO_CLASIFICADO_LABELS,
  type OpcionPeriodo,
} from '../lib/periodos';

const PAGO_FORM_INICIAL = {
  periodo: '',
  periodoPago: '',
  monto: '',
  medioPago: '',
  tipoPago: 'completo' as 'completo' | 'abono',
  tipoServicio: '' as TipoProveedor | '',
};

const TIPO_SERVICIO_LABELS: Record<TipoProveedor, string> = {
  AGUA: 'Agua',
  LUZ: 'Luz',
  GAS: 'Gas',
};

const CATEGORIA_PAGO_LABELS: Record<CategoriaPago, string> = {
  ARRIENDO: 'arriendo',
  SERVICIOS_BASICOS: 'servicios básicos',
  GARANTIA: 'garantía',
};

interface BloquePagosCategoriaProps {
  arriendo: ArriendoPropiedad;
  categoria: CategoriaPago;
  titulo: string;
  pagos: Pago[];
  onRegistrado: () => void;
}

function BloquePagosCategoria({
  arriendo,
  categoria,
  titulo,
  pagos,
  onRegistrado,
}: BloquePagosCategoriaProps) {
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(PAGO_FORM_INICIAL);
  const [opcionesPeriodo, setOpcionesPeriodo] = useState<OpcionPeriodo[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const pagosOrdenados = [...pagos].sort((a, b) => b.periodo.localeCompare(a.periodo));

  const abrirFormulario = () => {
    const { opciones, proximoValue } = generarOpcionesPeriodo(pagos);
    setOpcionesPeriodo(opciones);
    setForm({
      ...PAGO_FORM_INICIAL,
      periodo: hoyDdmmyyyy(),
      periodoPago: proximoValue,
      monto: categoria === 'ARRIENDO' ? arriendo.montoArriendo : '',
    });
    setError(null);
    setShowForm(true);
  };

  const cerrarFormulario = () => {
    setShowForm(false);
    setForm(PAGO_FORM_INICIAL);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const periodo = ddmmyyyyToIso(form.periodo);
    if (!periodo) {
      setError('La fecha de pago debe tener el formato dd/mm/aaaa.');
      return;
    }
    if (!form.periodoPago) {
      setError('Elige el periodo de pago.');
      return;
    }
    if (categoria === 'ARRIENDO' && !form.medioPago) {
      setError('Elige el medio de pago.');
      return;
    }
    if (categoria === 'SERVICIOS_BASICOS' && !form.tipoServicio) {
      setError('Elige a qué servicio corresponde el pago.');
      return;
    }

    const fechaComprometida = periodoValorAFecha(form.periodoPago, arriendo.fechaPago);

    setSaving(true);
    try {
      await api.post('/pagos', {
        arriendoTipo: 'propiedad',
        arriendoId: arriendo.id,
        periodo,
        fechaComprometida,
        monto: Number(form.monto),
        medioPago: categoria === 'ARRIENDO' ? form.medioPago : undefined,
        esAbono:
          categoria === 'ARRIENDO'
            ? calcularEsAbono(
                Number(form.monto),
                Number(arriendo.montoArriendo),
                pagos.filter((p) => p.fechaComprometida.slice(0, 7) === form.periodoPago),
              )
            : form.tipoPago === 'abono',
        categoria,
        tipoServicio: categoria === 'SERVICIOS_BASICOS' ? form.tipoServicio : undefined,
      });
      cerrarFormulario();
      onRegistrado();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="pagos-arrendatario__categoria">
      <div className="page-header">
        <h3>{titulo}</h3>
        <button type="button" onClick={abrirFormulario}>
          + Registrar pago
        </button>
      </div>

      {showForm && (
        <Modal
          titulo={`Registrar pago de ${CATEGORIA_PAGO_LABELS[categoria]}`}
          onClose={cerrarFormulario}
        >
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="inline-form__grid">
            <label>
              Fecha de pago
              <DateInput
                value={form.periodo}
                onChange={(value) => setForm({ ...form, periodo: value })}
                required
              />
            </label>
            <label>
              Periodo de pago
              <select
                required
                value={form.periodoPago}
                onChange={(e) => setForm({ ...form, periodoPago: e.target.value })}
              >
                {opcionesPeriodo.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            {categoria === 'SERVICIOS_BASICOS' && (
              <label>
                Servicio
                <select
                  required
                  value={form.tipoServicio}
                  onChange={(e) =>
                    setForm({ ...form, tipoServicio: e.target.value as TipoProveedor })
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
            {categoria === 'SERVICIOS_BASICOS' && (
              <label>
                Tipo de pago
                <select
                  value={form.tipoPago}
                  onChange={(e) =>
                    setForm({ ...form, tipoPago: e.target.value as 'completo' | 'abono' })
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
                value={form.monto}
                onChange={(e) => setForm({ ...form, monto: e.target.value })}
              />
            </label>
            {categoria === 'ARRIENDO' && (
              <label>
                Medio de pago
                <select
                  required
                  value={form.medioPago}
                  onChange={(e) => setForm({ ...form, medioPago: e.target.value })}
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

          {error && <p className="auth-card__error">{error}</p>}

          <button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Registrar'}
          </button>
        </form>
        </Modal>
      )}

      {pagosOrdenados.length === 0 && <p className="empty-state">Sin pagos registrados.</p>}
      {pagosOrdenados.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                {categoria === 'SERVICIOS_BASICOS' && <th>Servicio</th>}
                <th>Fecha de pago</th>
                <th>Periodo de pago</th>
                <th>Monto</th>
                <th>Tipo</th>
                <th>Estado</th>
                <th>Revisión</th>
              </tr>
            </thead>
            <tbody>
              {pagosOrdenados.map((pago) => (
                <tr key={pago.id}>
                  {categoria === 'SERVICIOS_BASICOS' && (
                    <td>{pago.tipoServicio ? TIPO_SERVICIO_LABELS[pago.tipoServicio] : ''}</td>
                  )}
                  <td>{formatFecha(pago.periodo)}</td>
                  <td>{formatFecha(pago.fechaComprometida)}</td>
                  <td>{formatMonto(pago.monto)}</td>
                  <td>
                    {(() => {
                      const tipo = clasificarTipoPago(
                        pago,
                        pagos.filter(
                          (p) =>
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
                  <td>
                    <span className={`badge badge--${pago.estado.toLowerCase()}`}>
                      {pago.estado as EstadoPago}
                    </span>
                  </td>
                  <td>
                    {pago.aprobado !== null && (
                      <span className="icono-revision icono-revision--aprobado" title="Revisado">
                        <IconCheck />
                      </span>
                    )}
                    {pago.aprobado === null && (
                      <span className="icono-revision icono-revision--pendiente" title="Pendiente">
                        <IconReloj />
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

interface BloqueArriendoProps {
  arriendo: ArriendoPropiedad;
}

function BloqueArriendo({ arriendo }: BloqueArriendoProps) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);

  const cargar = () => {
    setLoading(true);
    api
      .get<Pago[]>(`/pagos?arriendoTipo=propiedad&arriendoId=${arriendo.id}`)
      .then(setPagos)
      .finally(() => setLoading(false));
  };

  useEffect(cargar, [arriendo.id]);

  const pagosArriendo = pagos.filter((p) => p.categoria === 'ARRIENDO');
  const pagosServicios = pagos.filter((p) => p.categoria === 'SERVICIOS_BASICOS');

  const ultimoPago =
    [...pagosArriendo].sort((a, b) => b.periodo.localeCompare(a.periodo)).find((p) => p.estado === 'PAGADO') ??
    [...pagosArriendo].sort((a, b) => b.periodo.localeCompare(a.periodo))[0];
  const totalAbonado = pagosArriendo
    .filter((p) => p.estado === 'PAGADO')
    .reduce((acc, p) => acc + Number(p.monto), 0);
  const totalPendiente = pagosArriendo
    .filter((p) => p.estado === 'PENDIENTE' || p.estado === 'ATRASADO')
    .reduce((acc, p) => acc + Number(p.monto), 0);

  return (
    <section className="detail-card pagos-arrendatario__bloque">
      <h2>
        <Link to={`/arriendos/${arriendo.id}`}>
          {arriendo.propiedad.calle} {arriendo.propiedad.numero}
        </Link>
      </h2>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-card__label">Último pago de arriendo</span>
              <span className="stat-card__value">
                {ultimoPago ? formatMonto(ultimoPago.monto) : '—'}
              </span>
              <span className="stat-card__count">
                {ultimoPago
                  ? `${formatFecha(ultimoPago.periodo)} · ${ultimoPago.estado}${
                      ultimoPago.esAbono ? ' · Abono' : ''
                    }`
                  : 'Sin pagos aún'}
              </span>
            </div>
            <div className="stat-card stat-card--pagado">
              <span className="stat-card__label">Total abonado</span>
              <span className="stat-card__value">{formatMonto(totalAbonado)}</span>
            </div>
            <div className="stat-card stat-card--pendiente">
              <span className="stat-card__label">Saldo pendiente</span>
              <span className="stat-card__value">{formatMonto(totalPendiente)}</span>
            </div>
          </div>

          <BloquePagosCategoria
            arriendo={arriendo}
            categoria="ARRIENDO"
            titulo="Arriendo"
            pagos={pagosArriendo}
            onRegistrado={cargar}
          />
          <BloquePagosCategoria
            arriendo={arriendo}
            categoria="SERVICIOS_BASICOS"
            titulo="Pagos de servicios básicos"
            pagos={pagosServicios}
            onRegistrado={cargar}
          />
        </>
      )}
    </section>
  );
}

const PAGO_AUTO_FORM_INICIAL = {
  periodo: '',
  fechaComprometida: '',
  monto: '',
  medioPago: '',
  tipoPago: 'completo' as 'completo' | 'abono',
};

interface BloqueArriendoAutoProps {
  arriendoAuto: ArriendoAuto;
}

function BloqueArriendoAuto({ arriendoAuto }: BloqueArriendoAutoProps) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [mantenciones, setMantenciones] = useState<MantencionAuto[]>([]);
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionMantencion[]>([]);
  const [loading, setLoading] = useState(true);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(PAGO_AUTO_FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cargarPagos = () => {
    api.get<Pago[]>(`/pagos?arriendoTipo=auto&arriendoId=${arriendoAuto.id}`).then(setPagos);
  };

  useEffect(() => {
    setLoading(true);
    Promise.all([
      api.get<Pago[]>(`/pagos?arriendoTipo=auto&arriendoId=${arriendoAuto.id}`),
      api.get<MantencionAuto[]>(`/autos/${arriendoAuto.autoId}/mantenciones`),
      api.get<ConfiguracionMantencion[]>('/configuraciones-mantencion'),
    ])
      .then(([pagosData, mantencionesData, configsData]) => {
        setPagos(pagosData);
        setMantenciones(mantencionesData);
        setConfiguraciones(configsData);
      })
      .finally(() => setLoading(false));
  }, [arriendoAuto.id, arriendoAuto.autoId]);

  const pagosOrdenados = [...pagos].sort((a, b) => b.periodo.localeCompare(a.periodo));

  const abrirFormulario = () => {
    setForm({ ...PAGO_AUTO_FORM_INICIAL, periodo: hoyDdmmyyyy() });
    setError(null);
    setShowForm(true);
  };

  const cerrarFormulario = () => {
    setShowForm(false);
    setForm(PAGO_AUTO_FORM_INICIAL);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const periodo = ddmmyyyyToIso(form.periodo);
    const fechaComprometida = ddmmyyyyToIso(form.fechaComprometida);
    if (!periodo || !fechaComprometida) {
      setError('Revisa las fechas, deben tener el formato dd/mm/aaaa.');
      return;
    }
    if (!form.medioPago) {
      setError('Elige el medio de pago.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/pagos', {
        arriendoTipo: 'auto',
        arriendoId: arriendoAuto.id,
        periodo,
        fechaComprometida,
        monto: Number(form.monto),
        medioPago: form.medioPago,
        esAbono: form.tipoPago === 'abono',
        categoria: 'ARRIENDO',
      });
      cerrarFormulario();
      cargarPagos();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="detail-card pagos-arrendatario__bloque">
      <h2>{arriendoAuto.auto.patente}</h2>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <div className="pagos-arrendatario__categoria">
            <div className="page-header">
              <h3>Pagos de arriendo</h3>
              <button type="button" onClick={abrirFormulario}>
                + Registrar pago
              </button>
            </div>

            {showForm && (
              <Modal titulo="Registrar pago de arriendo" onClose={cerrarFormulario}>
                <form className="inline-form" onSubmit={handleSubmit}>
                  <div className="inline-form__grid">
                    <label>
                      Fecha de pago
                      <DateInput
                        value={form.periodo}
                        onChange={(value) => setForm({ ...form, periodo: value })}
                        required
                      />
                    </label>
                    <label>
                      Periodo de pago
                      <DateInput
                        value={form.fechaComprometida}
                        onChange={(value) => setForm({ ...form, fechaComprometida: value })}
                        required
                      />
                    </label>
                    <label>
                      Tipo de pago
                      <select
                        value={form.tipoPago}
                        onChange={(e) =>
                          setForm({ ...form, tipoPago: e.target.value as 'completo' | 'abono' })
                        }
                      >
                        <option value="completo">Pago completo</option>
                        <option value="abono">Abono</option>
                      </select>
                    </label>
                    <label>
                      Monto
                      <input
                        type="number"
                        min={0}
                        required
                        value={form.monto}
                        onChange={(e) => setForm({ ...form, monto: e.target.value })}
                      />
                    </label>
                    <label>
                      Medio de pago
                      <select
                        required
                        value={form.medioPago}
                        onChange={(e) => setForm({ ...form, medioPago: e.target.value })}
                      >
                        <option value="">Selecciona…</option>
                        {MEDIOS_PAGO.map((medio) => (
                          <option key={medio} value={medio}>
                            {medio}
                          </option>
                        ))}
                      </select>
                    </label>
                  </div>

                  {error && <p className="auth-card__error">{error}</p>}

                  <button type="submit" disabled={saving}>
                    {saving ? 'Guardando…' : 'Registrar'}
                  </button>
                </form>
              </Modal>
            )}

            {pagosOrdenados.length === 0 && <p className="empty-state">Sin pagos registrados.</p>}
            {pagosOrdenados.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha de pago</th>
                      <th>Periodo de pago</th>
                      <th>Monto</th>
                      <th>Tipo</th>
                      <th>Estado</th>
                      <th>Revisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {pagosOrdenados.map((pago) => (
                      <tr key={pago.id}>
                        <td>{formatFecha(pago.periodo)}</td>
                        <td>{formatFecha(pago.fechaComprometida)}</td>
                        <td>{formatMonto(pago.monto)}</td>
                        <td>{pago.esAbono ? 'Abono' : 'Completo'}</td>
                        <td>
                          <span className={`badge badge--${pago.estado.toLowerCase()}`}>
                            {pago.estado as EstadoPago}
                          </span>
                        </td>
                        <td>
                          {pago.aprobado !== null && (
                            <span
                              className="icono-revision icono-revision--aprobado"
                              title="Revisado"
                            >
                              <IconCheck />
                            </span>
                          )}
                          {pago.aprobado === null && (
                            <span
                              className="icono-revision icono-revision--pendiente"
                              title="Pendiente"
                            >
                              <IconReloj />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="pagos-arrendatario__categoria">
            <h3>Mantenciones</h3>

            {mantenciones.length === 0 && (
              <p className="empty-state">Sin mantenciones registradas.</p>
            )}
            {mantenciones.length > 0 && (
              <div className="table-wrap">
                <table className="table">
                  <thead>
                    <tr>
                      <th>Fecha</th>
                      <th>Kilometraje</th>
                      {configuraciones.map((c) => (
                        <th key={c.id}>{c.tipo}</th>
                      ))}
                      <th>Costo</th>
                      <th>Revisión</th>
                    </tr>
                  </thead>
                  <tbody>
                    {mantenciones.map((m) => (
                      <tr key={m.id}>
                        <td>{formatFecha(m.fechaMantencion)}</td>
                        <td>{m.kilometrajeActual.toLocaleString('es-CL')} km</td>
                        {configuraciones.map((c) => (
                          <td key={c.id} style={{ textAlign: 'center' }}>
                            {m.items.some((item) => item.configuracionId === c.id) ? '✓' : ''}
                          </td>
                        ))}
                        <td>{m.costo ? formatMonto(m.costo) : '—'}</td>
                        <td>
                          {m.aprobado !== null && (
                            <span
                              className="icono-revision icono-revision--aprobado"
                              title="Revisado"
                            >
                              <IconCheck />
                            </span>
                          )}
                          {m.aprobado === null && (
                            <span
                              className="icono-revision icono-revision--pendiente"
                              title="Pendiente"
                            >
                              <IconReloj />
                            </span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </section>
  );
}

export function PagosArrendatarioPage() {
  const [arriendos, setArriendos] = useState<ArriendoPropiedad[]>([]);
  const [arriendosAuto, setArriendosAuto] = useState<ArriendoAuto[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      api.get<ArriendoPropiedad[]>('/arriendos-propiedad'),
      api.get<ArriendoAuto[]>('/arriendos-auto'),
    ])
      .then(([propiedades, autos]) => {
        setArriendos(propiedades);
        setArriendosAuto(autos);
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Mis pagos</h1>

      {loading && <p>Cargando…</p>}
      {!loading && arriendos.length === 0 && arriendosAuto.length === 0 && (
        <p className="empty-state">No tienes arriendos asociados.</p>
      )}

      {arriendos.map((arriendo) => (
        <BloqueArriendo key={arriendo.id} arriendo={arriendo} />
      ))}
      {arriendosAuto.map((arriendoAuto) => (
        <BloqueArriendoAuto key={arriendoAuto.id} arriendoAuto={arriendoAuto} />
      ))}
    </div>
  );
}
