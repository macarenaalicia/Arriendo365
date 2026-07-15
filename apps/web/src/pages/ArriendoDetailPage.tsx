import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type {
  ArriendoPropiedad,
  EstadoPago,
  EstadoRequerimiento,
  Pago,
  Persona,
  Requerimiento,
  TipoReparacion,
  UrgenciaRequerimiento,
} from '../api/types';
import { ddmmyyyyToIso, formatFecha, hoyDdmmyyyy, isoToDdmmyyyy } from '../lib/format';
import { DateInput } from '../components/DateInput';
import {
  MEDIOS_PAGO,
  asegurarOpcion,
  generarOpcionesPeriodo,
  periodoValorAFecha,
  type OpcionPeriodo,
} from '../lib/periodos';

const ESTADOS_PAGO: EstadoPago[] = ['PENDIENTE', 'PAGADO', 'ATRASADO', 'RECHAZADO'];
const URGENCIAS: UrgenciaRequerimiento[] = ['BAJA', 'MEDIA', 'CRITICA'];
const TIPOS_REPARACION: TipoReparacion[] = ['LOCATIVA', 'ESTRUCTURAL'];
const ESTADOS_REQUERIMIENTO: EstadoRequerimiento[] = [
  'PENDIENTE_REVISION',
  'REVISION_AGENDADA',
  'EN_REVISION',
  'RESUELTO',
];

const PAGO_FORM_INICIAL = {
  periodo: '',
  periodoPago: '',
  monto: '',
  medioPago: '',
  tipoPago: 'completo' as 'completo' | 'abono',
  estado: 'PENDIENTE' as EstadoPago,
};

const REQ_FORM_INICIAL = {
  urgencia: 'MEDIA' as UrgenciaRequerimiento,
  tipoReparacion: 'LOCATIVA' as TipoReparacion,
  notasArrendatario: '',
  estado: 'PENDIENTE_REVISION' as EstadoRequerimiento,
  tecnicoId: '',
  detalleResolucion: '',
};

function formatMonto(monto: string | number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
    Number(monto),
  );
}

export function ArriendoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { rol } = useAuth();
  const esStaff = rol !== 'ARRENDATARIO';

  const [arriendo, setArriendo] = useState<ArriendoPropiedad | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPagoForm, setShowPagoForm] = useState(false);
  const [editingPagoId, setEditingPagoId] = useState<string | null>(null);
  const [pagoForm, setPagoForm] = useState(PAGO_FORM_INICIAL);
  const [opcionesPeriodo, setOpcionesPeriodo] = useState<OpcionPeriodo[]>([]);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [savingPago, setSavingPago] = useState(false);

  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showReqForm, setShowReqForm] = useState(false);
  const [editingReqId, setEditingReqId] = useState<string | null>(null);
  const [reqForm, setReqForm] = useState(REQ_FORM_INICIAL);
  const [reqError, setReqError] = useState<string | null>(null);
  const [savingReq, setSavingReq] = useState(false);

  const cargarPagos = () => {
    if (!id) return;
    api.get<Pago[]>(`/pagos?arriendoTipo=propiedad&arriendoId=${id}`).then(setPagos);
  };

  const cargarRequerimientos = () => {
    if (!id) return;
    api.get<Requerimiento[]>(`/requerimientos?arriendoPropiedadId=${id}`).then(setRequerimientos);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<ArriendoPropiedad>(`/arriendos-propiedad/${id}`),
      api.get<Pago[]>(`/pagos?arriendoTipo=propiedad&arriendoId=${id}`),
      api.get<Requerimiento[]>(`/requerimientos?arriendoPropiedadId=${id}`),
    ])
      .then(([arriendoData, pagosData, requerimientosData]) => {
        setArriendo(arriendoData);
        setPagos(pagosData);
        setRequerimientos(requerimientosData);
      })
      .catch(() => setError('No se pudo cargar el detalle del arriendo'))
      .finally(() => setLoading(false));
  }, [id]);

  useEffect(() => {
    if (esStaff) {
      api.get<Persona[]>('/personas').then(setPersonas);
    }
  }, [esStaff]);

  const cerrarPagoForm = () => {
    setShowPagoForm(false);
    setEditingPagoId(null);
    setPagoForm(PAGO_FORM_INICIAL);
    setPagoError(null);
  };

  const abrirCreacionPago = () => {
    const { opciones, proximoValue } = generarOpcionesPeriodo(pagos);
    setOpcionesPeriodo(opciones);
    setPagoForm({
      ...PAGO_FORM_INICIAL,
      periodo: hoyDdmmyyyy(),
      periodoPago: proximoValue,
      monto: arriendo ? arriendo.montoArriendo : '',
    });
    setEditingPagoId(null);
    setShowPagoForm(true);
  };

  const abrirEdicionPago = (pago: Pago) => {
    const { opciones } = generarOpcionesPeriodo(pagos);
    const valorMes = pago.fechaComprometida.slice(0, 7);
    setOpcionesPeriodo(asegurarOpcion(opciones, valorMes));
    setPagoForm({
      periodo: isoToDdmmyyyy(pago.periodo),
      periodoPago: valorMes,
      monto: pago.monto,
      medioPago: pago.medioPago ?? '',
      tipoPago: pago.esAbono ? 'abono' : 'completo',
      estado: pago.estado,
    });
    setEditingPagoId(pago.id);
    setShowPagoForm(true);
  };

  const handleSubmitPago = async (event: React.FormEvent) => {
    event.preventDefault();
    setPagoError(null);

    const periodo = ddmmyyyyToIso(pagoForm.periodo);
    if (!periodo) {
      setPagoError('La fecha de pago debe tener el formato dd/mm/aaaa.');
      return;
    }
    if (!pagoForm.periodoPago) {
      setPagoError('Elige el periodo de pago.');
      return;
    }
    if (!pagoForm.medioPago) {
      setPagoError('Elige el medio de pago.');
      return;
    }

    const fechaComprometida = periodoValorAFecha(pagoForm.periodoPago, arriendo?.fechaPago ?? 1);

    setSavingPago(true);
    try {
      const payload = {
        arriendoTipo: 'propiedad',
        arriendoId: id,
        periodo,
        fechaComprometida,
        monto: Number(pagoForm.monto),
        medioPago: pagoForm.medioPago,
        esAbono: pagoForm.tipoPago === 'abono',
        estado: pagoForm.estado,
      };

      if (editingPagoId) {
        await api.patch(`/pagos/${editingPagoId}`, payload);
      } else {
        await api.post('/pagos', payload);
      }

      cerrarPagoForm();
      cargarPagos();
    } catch (err) {
      setPagoError(err instanceof ApiError ? err.message : 'No se pudo guardar el pago');
    } finally {
      setSavingPago(false);
    }
  };

  const handleDeletePago = async (pagoId: string) => {
    if (!confirm('¿Eliminar este pago?')) return;
    await api.delete(`/pagos/${pagoId}`);
    if (editingPagoId === pagoId) cerrarPagoForm();
    setPagos((prev) => prev.filter((p) => p.id !== pagoId));
  };

  const cerrarReqForm = () => {
    setShowReqForm(false);
    setEditingReqId(null);
    setReqForm(REQ_FORM_INICIAL);
    setReqError(null);
  };

  const abrirCreacionReq = () => {
    setReqForm(REQ_FORM_INICIAL);
    setEditingReqId(null);
    setShowReqForm(true);
  };

  const abrirEdicionReq = (req: Requerimiento) => {
    setReqForm({
      urgencia: req.urgencia,
      tipoReparacion: req.tipoReparacion,
      notasArrendatario: req.notasArrendatario ?? '',
      estado: req.estado,
      tecnicoId: req.tecnicoId ?? '',
      detalleResolucion: req.detalleResolucion ?? '',
    });
    setEditingReqId(req.id);
    setShowReqForm(true);
  };

  const handleSubmitReq = async (event: React.FormEvent) => {
    event.preventDefault();
    setReqError(null);
    setSavingReq(true);
    try {
      if (editingReqId) {
        await api.patch(`/requerimientos/${editingReqId}`, {
          urgencia: reqForm.urgencia,
          tipoReparacion: reqForm.tipoReparacion,
          notasArrendatario: reqForm.notasArrendatario || undefined,
          estado: reqForm.estado,
          tecnicoId: reqForm.tecnicoId || undefined,
          detalleResolucion: reqForm.detalleResolucion || undefined,
        });
      } else {
        await api.post('/requerimientos', {
          arriendoPropiedadId: id,
          urgencia: reqForm.urgencia,
          tipoReparacion: reqForm.tipoReparacion,
          notasArrendatario: reqForm.notasArrendatario || undefined,
        });
      }

      cerrarReqForm();
      cargarRequerimientos();
    } catch (err) {
      setReqError(err instanceof ApiError ? err.message : 'No se pudo guardar el requerimiento');
    } finally {
      setSavingReq(false);
    }
  };

  const handleDeleteReq = async (reqId: string) => {
    if (!confirm('¿Eliminar este requerimiento?')) return;
    await api.delete(`/requerimientos/${reqId}`);
    if (editingReqId === reqId) cerrarReqForm();
    setRequerimientos((prev) => prev.filter((r) => r.id !== reqId));
  };

  if (loading) return <p>Cargando…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!arriendo) return null;

  return (
    <div>
      <Link to="/" className="back-link">
        ← Volver a arriendos
      </Link>

      <div className="page-header">
        <h1>
          {arriendo.propiedad.calle} {arriendo.propiedad.numero}
        </h1>
        <span className={`badge badge--${arriendo.estado.toLowerCase()}`}>{arriendo.estado}</span>
      </div>

      <section className="detail-grid">
        <div className="detail-card">
          <h2>Propiedad</h2>
          <p>
            {arriendo.propiedad.calle} {arriendo.propiedad.numero}, {arriendo.propiedad.ciudad}
          </p>
          <p>
            {arriendo.propiedad.tipo} · {arriendo.propiedad.nHabitaciones} hab ·{' '}
            {arriendo.propiedad.nBanos} baños
          </p>
        </div>

        <div className="detail-card">
          <h2>Arrendatario</h2>
          <p>{arriendo.arrendatario.nombreCompleto}</p>
          <p>{arriendo.arrendatario.rut}</p>
          {arriendo.arrendatario.email && <p>{arriendo.arrendatario.email}</p>}
        </div>

        <div className="detail-card">
          <h2>Condiciones</h2>
          <p>Monto: {formatMonto(arriendo.montoArriendo)}</p>
          <p>Día de pago: {arriendo.fechaPago}</p>
          <p>Entrega: {formatFecha(arriendo.fechaEntrega)}</p>
          <p>Reajuste: {arriendo.periodoAlza}</p>
        </div>
      </section>

      <section>
        <div className="page-header">
          <h2>Pagos</h2>
          <button type="button" onClick={showPagoForm ? cerrarPagoForm : abrirCreacionPago}>
            {showPagoForm ? 'Cancelar' : '+ Registrar pago'}
          </button>
        </div>

        {showPagoForm && (
          <form className="inline-form" onSubmit={handleSubmitPago}>
            <div className="inline-form__grid">
              <label>
                Fecha de pago
                <DateInput
                  value={pagoForm.periodo}
                  onChange={(value) => setPagoForm({ ...pagoForm, periodo: value })}
                  required
                />
              </label>
              <label>
                Periodo de pago
                <select
                  required
                  value={pagoForm.periodoPago}
                  onChange={(e) => setPagoForm({ ...pagoForm, periodoPago: e.target.value })}
                >
                  {opcionesPeriodo.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo de pago
                <select
                  value={pagoForm.tipoPago}
                  onChange={(e) => {
                    const tipoPago = e.target.value as 'completo' | 'abono';
                    setPagoForm({
                      ...pagoForm,
                      tipoPago,
                      monto: tipoPago === 'completo' && arriendo ? arriendo.montoArriendo : pagoForm.monto,
                    });
                  }}
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
                  disabled={pagoForm.tipoPago === 'completo'}
                  value={pagoForm.monto}
                  onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                />
              </label>
              <label>
                Medio de pago
                <select
                  required
                  value={pagoForm.medioPago}
                  onChange={(e) => setPagoForm({ ...pagoForm, medioPago: e.target.value })}
                >
                  <option value="">Selecciona…</option>
                  {MEDIOS_PAGO.map((medio) => (
                    <option key={medio} value={medio}>
                      {medio}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Estado
                <select
                  value={pagoForm.estado}
                  onChange={(e) =>
                    setPagoForm({ ...pagoForm, estado: e.target.value as EstadoPago })
                  }
                >
                  {ESTADOS_PAGO.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {pagoError && <p className="auth-card__error">{pagoError}</p>}

            <button type="submit" disabled={savingPago}>
              {savingPago ? 'Guardando…' : editingPagoId ? 'Guardar cambios' : 'Guardar pago'}
            </button>
          </form>
        )}

        {pagos.length === 0 && <p className="empty-state">Sin pagos registrados.</p>}
        {pagos.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Fecha de pago</th>
                  <th>Periodo de pago</th>
                  <th>Monto</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  {esStaff && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{formatFecha(pago.periodo)}</td>
                    <td>{formatFecha(pago.fechaComprometida)}</td>
                    <td>{formatMonto(pago.monto)}</td>
                    <td>{pago.esAbono ? 'Abono' : 'Completo'}</td>
                    <td>
                      <span className={`badge badge--${pago.estado.toLowerCase()}`}>
                        {pago.estado}
                      </span>
                    </td>
                    {esStaff && (
                      <td>
                        <div className="table__actions">
                          <button type="button" onClick={() => abrirEdicionPago(pago)}>
                            Editar
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeletePago(pago.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section>
        <div className="page-header">
          <h2>Requerimientos</h2>
          <button type="button" onClick={showReqForm ? cerrarReqForm : abrirCreacionReq}>
            {showReqForm ? 'Cancelar' : '+ Reportar requerimiento'}
          </button>
        </div>

        {showReqForm && (
          <form className="inline-form" onSubmit={handleSubmitReq}>
            <div className="inline-form__grid">
              <label>
                Urgencia
                <select
                  value={reqForm.urgencia}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, urgencia: e.target.value as UrgenciaRequerimiento })
                  }
                >
                  {URGENCIAS.map((u) => (
                    <option key={u} value={u}>
                      {u}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Tipo de reparación
                <select
                  value={reqForm.tipoReparacion}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, tipoReparacion: e.target.value as TipoReparacion })
                  }
                >
                  {TIPOS_REPARACION.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              {editingReqId && esStaff && (
                <>
                  <label>
                    Estado
                    <select
                      value={reqForm.estado}
                      onChange={(e) =>
                        setReqForm({
                          ...reqForm,
                          estado: e.target.value as EstadoRequerimiento,
                        })
                      }
                    >
                      {ESTADOS_REQUERIMIENTO.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label>
                    Técnico asignado
                    <select
                      value={reqForm.tecnicoId}
                      onChange={(e) => setReqForm({ ...reqForm, tecnicoId: e.target.value })}
                    >
                      <option value="">Sin asignar</option>
                      {personas.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.nombreCompleto}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>

            <label>
              Descripción
              <textarea
                placeholder="Describe el problema…"
                value={reqForm.notasArrendatario}
                onChange={(e) => setReqForm({ ...reqForm, notasArrendatario: e.target.value })}
              />
            </label>

            {editingReqId && esStaff && (
              <label>
                Detalle de resolución
                <textarea
                  value={reqForm.detalleResolucion}
                  onChange={(e) =>
                    setReqForm({ ...reqForm, detalleResolucion: e.target.value })
                  }
                />
              </label>
            )}

            {reqError && <p className="auth-card__error">{reqError}</p>}

            <button type="submit" disabled={savingReq}>
              {savingReq ? 'Guardando…' : editingReqId ? 'Guardar cambios' : 'Reportar'}
            </button>
          </form>
        )}

        {requerimientos.length === 0 && (
          <p className="empty-state">Sin requerimientos registrados.</p>
        )}
        {requerimientos.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Urgencia</th>
                  <th>Tipo</th>
                  <th>Estado</th>
                  <th>Técnico</th>
                  <th>Descripción</th>
                  {esStaff && <th>Acciones</th>}
                </tr>
              </thead>
              <tbody>
                {requerimientos.map((req) => (
                  <tr key={req.id}>
                    <td>
                      <span className={`badge badge--${req.urgencia.toLowerCase()}`}>
                        {req.urgencia}
                      </span>
                    </td>
                    <td>{req.tipoReparacion}</td>
                    <td>{req.estado.replace(/_/g, ' ')}</td>
                    <td>{req.tecnico?.nombreCompleto ?? ''}</td>
                    <td>{req.notasArrendatario ?? ''}</td>
                    {esStaff && (
                      <td>
                        <div className="table__actions">
                          <button type="button" onClick={() => abrirEdicionReq(req)}>
                            Editar
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleDeleteReq(req.id)}
                          >
                            Eliminar
                          </button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
