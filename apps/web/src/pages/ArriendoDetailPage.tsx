import { Fragment, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type {
  ArriendoPropiedad,
  CategoriaPago,
  Documento,
  EstadoPago,
  EstadoRequerimiento,
  Pago,
  Persona,
  Requerimiento,
  TipoProveedor,
  TipoReparacion,
  UrgenciaRequerimiento,
} from '../api/types';
import { ddmmyyyyToIso, formatFecha, formatMonto, hoyDdmmyyyy, isoToDdmmyyyy } from '../lib/format';
import { DateInput } from '../components/DateInput';
import { Modal } from '../components/Modal';
import { useConfirmarEliminar } from '../lib/useConfirmarEliminar';
import { IconCheck, IconEditar, IconEliminar, IconReloj, IconRechazar } from '../components/icons';
import { eliminarDocumento, listarDocumentos, subirDocumento } from '../lib/documentos';
import {
  HistorialRequerimientoBoton,
  HistorialRequerimientoFilas,
} from '../components/HistorialRequerimiento';
import {
  MEDIOS_PAGO,
  asegurarOpcion,
  calcularEsAbono,
  clasificarTipoPago,
  generarOpcionesPeriodo,
  periodoValorAFecha,
  TIPO_PAGO_CLASIFICADO_LABELS,
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
  'RECHAZADO',
  'REABIERTO',
];

const PAGO_FORM_INICIAL = {
  periodo: '',
  periodoPago: '',
  monto: '',
  medioPago: '',
  tipoPago: 'completo' as 'completo' | 'abono',
  estado: 'PENDIENTE' as EstadoPago,
  categoria: 'ARRIENDO' as CategoriaPago,
  tipoServicio: '' as TipoProveedor | '',
};

const CATEGORIA_PAGO_LABELS: Record<CategoriaPago, string> = {
  ARRIENDO: 'arriendo',
  SERVICIOS_BASICOS: 'servicios básicos',
  GARANTIA: 'garantía',
};

const TIPO_SERVICIO_LABELS: Record<TipoProveedor, string> = {
  AGUA: 'Agua',
  LUZ: 'Luz',
  GAS: 'Gas',
};

const PERIODOS_ALZA = ['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'SIN REAJUSTE'] as const;

const CONDICIONES_FORM_INICIAL = {
  montoArriendo: '',
  fechaPago: '',
  fechaEntrega: '',
  periodoAlza: 'ANUAL' as (typeof PERIODOS_ALZA)[number],
};

const DOCUMENTO_TIPOS_ARRIENDO = [
  'Contrato de arriendo',
  'Anexo de contrato',
  'Comprobante de pago',
  'Cédula de identidad',
  'Otro',
];

const DOCUMENTO_FORM_INICIAL = {
  tipo: '',
  tipoOtro: '',
  fechaEmision: '',
  fechaVencimiento: '',
};

const REQ_FORM_INICIAL = {
  urgencia: 'MEDIA' as UrgenciaRequerimiento,
  tipoReparacion: 'LOCATIVA' as TipoReparacion,
  notasArrendatario: '',
  estado: 'PENDIENTE_REVISION' as EstadoRequerimiento,
  tecnicoId: '',
  notasInternas: '',
  detalleResolucion: '',
};

export function ArriendoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { hash } = useLocation();
  const { rol } = useAuth();
  const esStaff = rol !== 'ARRENDATARIO';

  const [arriendo, setArriendo] = useState<ArriendoPropiedad | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (loading || !hash) return;
    const el = document.querySelector(hash);
    el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }, [loading, hash]);

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
  const [historialAbiertoId, setHistorialAbiertoId] = useState<string | null>(null);

  const [showCondicionesForm, setShowCondicionesForm] = useState(false);
  const [condicionesForm, setCondicionesForm] = useState(CONDICIONES_FORM_INICIAL);
  const [condicionesError, setCondicionesError] = useState<string | null>(null);
  const [savingCondiciones, setSavingCondiciones] = useState(false);

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [documentoForm, setDocumentoForm] = useState(DOCUMENTO_FORM_INICIAL);
  const [subiendoDocumento, setSubiendoDocumento] = useState(false);
  const [documentoError, setDocumentoError] = useState<string | null>(null);
  const [mostrarAgregarDocumento, setMostrarAgregarDocumento] = useState(false);
  const [documentoRecienSubido, setDocumentoRecienSubido] = useState(false);
  const [arrastrandoDocumento, setArrastrandoDocumento] = useState(false);

  const cargarDocumentos = () => {
    if (!id) return;
    listarDocumentos('arriendo_propiedad', id).then(setDocumentos);
  };

  const subirArchivoDocumento = async (archivo: File) => {
    if (!id) return;

    const tipoFinal = documentoForm.tipo === 'Otro' ? documentoForm.tipoOtro.trim() : documentoForm.tipo;
    if (!tipoFinal) {
      setDocumentoError('Elige el tipo de documento.');
      return;
    }

    setDocumentoError(null);
    setSubiendoDocumento(true);
    try {
      await subirDocumento(
        archivo,
        tipoFinal,
        'arriendo_propiedad',
        id,
        documentoForm.fechaEmision || undefined,
        documentoForm.fechaVencimiento || undefined,
      );
      setDocumentoForm(DOCUMENTO_FORM_INICIAL);
      setDocumentoRecienSubido(true);
      cargarDocumentos();
    } catch (err) {
      setDocumentoError(err instanceof ApiError ? err.message : 'No se pudo subir el documento');
    } finally {
      setSubiendoDocumento(false);
    }
  };

  const handleSubirDocumento = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (archivo) subirArchivoDocumento(archivo);
  };

  const handleDropDocumento = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastrandoDocumento(false);
    const archivo = event.dataTransfer.files?.[0];
    if (archivo) subirArchivoDocumento(archivo);
  };

  const handleEliminarDocumento = async (documentoId: string) => {
    await eliminarDocumento(documentoId);
    setDocumentos((prev) => prev.filter((d) => d.id !== documentoId));
  };
  const eliminarDocumentoConfirmar = useConfirmarEliminar<string>(handleEliminarDocumento);

  const abrirModalDocumento = () => {
    setDocumentoForm(DOCUMENTO_FORM_INICIAL);
    setDocumentoError(null);
    setDocumentoRecienSubido(false);
    setMostrarAgregarDocumento(true);
  };

  const cerrarModalDocumento = () => {
    setMostrarAgregarDocumento(false);
    setDocumentoRecienSubido(false);
    setDocumentoForm(DOCUMENTO_FORM_INICIAL);
    setDocumentoError(null);
  };

  const agregarOtroDocumento = () => {
    setDocumentoForm(DOCUMENTO_FORM_INICIAL);
    setDocumentoError(null);
    setDocumentoRecienSubido(false);
  };

  const cargarArriendo = () => {
    if (!id) return;
    api.get<ArriendoPropiedad>(`/arriendos-propiedad/${id}`).then(setArriendo);
  };

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

  const cerrarCondicionesForm = () => {
    setShowCondicionesForm(false);
    setCondicionesError(null);
  };

  const abrirEdicionCondiciones = () => {
    if (!arriendo) return;
    setCondicionesForm({
      montoArriendo: arriendo.montoArriendo,
      fechaPago: String(arriendo.fechaPago),
      fechaEntrega: isoToDdmmyyyy(arriendo.fechaEntrega),
      periodoAlza: arriendo.periodoAlza as (typeof PERIODOS_ALZA)[number],
    });
    setCondicionesError(null);
    setShowCondicionesForm(true);
  };

  const handleSubmitCondiciones = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setCondicionesError(null);

    const fechaEntrega = ddmmyyyyToIso(condicionesForm.fechaEntrega);
    if (!fechaEntrega) {
      setCondicionesError('Fecha de entrega inválida, usa el formato dd/mm/aaaa.');
      return;
    }

    setSavingCondiciones(true);
    try {
      await api.patch(`/arriendos-propiedad/${id}`, {
        montoArriendo: Number(condicionesForm.montoArriendo),
        fechaPago: Number(condicionesForm.fechaPago),
        fechaEntrega,
        periodoAlza: condicionesForm.periodoAlza,
      });
      cerrarCondicionesForm();
      cargarArriendo();
    } catch (err) {
      setCondicionesError(
        err instanceof ApiError ? err.message : 'No se pudieron guardar las condiciones',
      );
    } finally {
      setSavingCondiciones(false);
    }
  };

  const handleDeleteArriendo = async () => {
    if (!id) return;
    await api.delete(`/arriendos-propiedad/${id}`);
    navigate('/');
  };
  const eliminarArriendoConfirmar = useConfirmarEliminar<true>(handleDeleteArriendo);

  useEffect(() => {
    if (esStaff) {
      api.get<Persona[]>('/personas').then(setPersonas);
      cargarDocumentos();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [esStaff, id]);

  const cerrarPagoForm = () => {
    setShowPagoForm(false);
    setEditingPagoId(null);
    setPagoForm(PAGO_FORM_INICIAL);
    setPagoError(null);
  };

  const abrirCreacionPago = (categoria: CategoriaPago) => {
    const pagosCategoria = pagos.filter((p) => p.categoria === categoria);
    const { opciones, proximoValue } = generarOpcionesPeriodo(pagosCategoria);
    setOpcionesPeriodo(opciones);
    setPagoForm({
      ...PAGO_FORM_INICIAL,
      periodo: hoyDdmmyyyy(),
      periodoPago: proximoValue,
      monto: categoria === 'ARRIENDO' && arriendo ? arriendo.montoArriendo : '',
      categoria,
    });
    setEditingPagoId(null);
    setShowPagoForm(true);
  };

  const abrirEdicionPago = (pago: Pago) => {
    const pagosCategoria = pagos.filter((p) => p.categoria === pago.categoria);
    const { opciones } = generarOpcionesPeriodo(pagosCategoria);
    const valorMes = pago.fechaComprometida.slice(0, 7);
    setOpcionesPeriodo(asegurarOpcion(opciones, valorMes));
    setPagoForm({
      periodo: isoToDdmmyyyy(pago.periodo),
      periodoPago: valorMes,
      monto: pago.monto,
      medioPago: pago.medioPago ?? '',
      tipoPago: pago.esAbono ? 'abono' : 'completo',
      estado: pago.estado,
      categoria: pago.categoria,
      tipoServicio: pago.tipoServicio ?? '',
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
    if (pagoForm.categoria === 'ARRIENDO' && !pagoForm.medioPago) {
      setPagoError('Elige el medio de pago.');
      return;
    }
    if (pagoForm.categoria === 'SERVICIOS_BASICOS' && !pagoForm.tipoServicio) {
      setPagoError('Elige a qué servicio corresponde el pago.');
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
        medioPago: pagoForm.categoria === 'ARRIENDO' ? pagoForm.medioPago : undefined,
        esAbono:
          pagoForm.categoria === 'ARRIENDO' && arriendo
            ? calcularEsAbono(
                Number(pagoForm.monto),
                Number(arriendo.montoArriendo),
                pagos.filter(
                  (p) =>
                    p.categoria === 'ARRIENDO' &&
                    p.fechaComprometida.slice(0, 7) === pagoForm.periodoPago,
                ),
                editingPagoId ?? undefined,
              )
            : pagoForm.tipoPago === 'abono',
        estado: pagoForm.estado,
        categoria: pagoForm.categoria,
        tipoServicio: pagoForm.categoria === 'SERVICIOS_BASICOS' ? pagoForm.tipoServicio : undefined,
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
    await api.delete(`/pagos/${pagoId}`);
    if (editingPagoId === pagoId) cerrarPagoForm();
    setPagos((prev) => prev.filter((p) => p.id !== pagoId));
  };
  const eliminarPagoConfirmar = useConfirmarEliminar<string>(handleDeletePago);

  const handleAprobarPago = async (pagoId: string) => {
    await api.patch(`/pagos/${pagoId}`, { aprobado: true, estado: 'PAGADO' });
    cargarPagos();
  };

  const handleRechazarPago = async (pagoId: string) => {
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
      notasInternas: req.notasInternas ?? '',
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
          notasInternas: reqForm.notasInternas || undefined,
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

  const handleRechazarReq = async (reqId: string) => {
    const motivo = prompt('Motivo del rechazo:');
    if (motivo === null) return;
    if (!motivo.trim()) {
      alert('Debes indicar un motivo de rechazo.');
      return;
    }
    await api.patch(`/requerimientos/${reqId}`, {
      estado: 'RECHAZADO',
      notaActualizacion: motivo.trim(),
    });
    if (editingReqId === reqId) cerrarReqForm();
    cargarRequerimientos();
  };

  const handleReabrirReq = async (reqId: string) => {
    await api.patch(`/requerimientos/${reqId}`, { estado: 'REABIERTO' });
    cargarRequerimientos();
  };

  if (loading) return <p>Cargando…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!arriendo) return null;

  const renderTablaPagos = (lista: Pago[], vacioLabel: string, mostrarServicio = false) => {
    if (lista.length === 0) {
      return <p className="empty-state">{vacioLabel}</p>;
    }
    return (
      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              {mostrarServicio && <th>Servicio</th>}
              <th>Fecha de pago</th>
              <th>Periodo de pago</th>
              <th>Monto</th>
              <th>Tipo</th>
              <th>Estado</th>
              <th>Revisión</th>
              {esStaff && <th>Acciones</th>}
            </tr>
          </thead>
          <tbody>
            {lista.map((pago) => (
              <tr key={pago.id}>
                {mostrarServicio && (
                  <td>{pago.tipoServicio ? TIPO_SERVICIO_LABELS[pago.tipoServicio] : ''}</td>
                )}
                <td>{formatFecha(pago.periodo)}</td>
                <td>{formatFecha(pago.fechaComprometida)}</td>
                <td>{formatMonto(pago.monto)}</td>
                <td>
                  {(() => {
                    const tipo = clasificarTipoPago(
                      pago,
                      lista.filter(
                        (p) => p.fechaComprometida.slice(0, 7) === pago.fechaComprometida.slice(0, 7),
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
                      <span className="icono-revision icono-revision--pendiente" title="Pendiente">
                        <IconReloj />
                      </span>
                      {esStaff && (
                        <>
                          <button type="button" onClick={() => handleAprobarPago(pago.id)}>
                            Aprobar
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleRechazarPago(pago.id)}
                          >
                            Rechazar
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </td>
                {esStaff && (
                  <td>
                    <div className="table__actions">
                      <button
                        type="button"
                        className="icon-button"
                        title="Editar"
                        aria-label="Editar"
                        onClick={() => abrirEdicionPago(pago)}
                      >
                        <IconEditar />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => eliminarPagoConfirmar.pedir(pago.id)}
                      >
                        <IconEliminar />
                      </button>
                    </div>
                  </td>
                )}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    );
  };

  const pagosArriendo = pagos.filter((p) => p.categoria === 'ARRIENDO');
  const pagosServicios = pagos.filter((p) => p.categoria === 'SERVICIOS_BASICOS');

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

        {esStaff ? (
          <div className="detail-card">
            <h2>Arrendatario</h2>
            <p>{arriendo.arrendatario.nombreCompleto}</p>
            {arriendo.arrendatario.rut && <p>{arriendo.arrendatario.rut}</p>}
            {arriendo.arrendatario.email && <p>{arriendo.arrendatario.email}</p>}
          </div>
        ) : (
          <div className="detail-card">
            <h2>Arrendador</h2>
            {arriendo.arrendador ? (
              <>
                <p>{arriendo.arrendador.nombreCompleto}</p>
                {arriendo.arrendador.email && <p>{arriendo.arrendador.email}</p>}
                {arriendo.arrendador.telefono && <p>{arriendo.arrendador.telefono}</p>}
              </>
            ) : (
              <p className="empty-state">Sin datos de contacto disponibles.</p>
            )}
          </div>
        )}

        <div className="detail-card">
          <h2>Condiciones</h2>
          <p>Monto: {formatMonto(arriendo.montoArriendo)}</p>
          <p>Día de pago: {arriendo.fechaPago}</p>
          <p>Entrega: {formatFecha(arriendo.fechaEntrega)}</p>
          <p>Reajuste: {arriendo.periodoAlza}</p>
          {esStaff && (
            <button type="button" className="link-button" onClick={abrirEdicionCondiciones}>
              Editar condiciones
            </button>
          )}
        </div>
      </section>

      {showCondicionesForm && (
        <Modal titulo="Editar condiciones" onClose={cerrarCondicionesForm}>
          <form className="inline-form" onSubmit={handleSubmitCondiciones}>
            <div className="inline-form__grid">
              <label>
                Monto arriendo
                <input
                  type="number"
                  min={0}
                  required
                  value={condicionesForm.montoArriendo}
                  onChange={(e) =>
                    setCondicionesForm({ ...condicionesForm, montoArriendo: e.target.value })
                  }
                />
              </label>
              <label>
                Día de pago (1-31)
                <input
                  type="number"
                  min={1}
                  max={31}
                  required
                  value={condicionesForm.fechaPago}
                  onChange={(e) =>
                    setCondicionesForm({ ...condicionesForm, fechaPago: e.target.value })
                  }
                />
              </label>
              <label>
                Fecha de entrega
                <DateInput
                  value={condicionesForm.fechaEntrega}
                  onChange={(value) =>
                    setCondicionesForm({ ...condicionesForm, fechaEntrega: value })
                  }
                  required
                />
              </label>
              <label>
                Periodo de reajuste
                <select
                  value={condicionesForm.periodoAlza}
                  onChange={(e) =>
                    setCondicionesForm({
                      ...condicionesForm,
                      periodoAlza: e.target.value as (typeof PERIODOS_ALZA)[number],
                    })
                  }
                >
                  {PERIODOS_ALZA.map((periodo) => (
                    <option key={periodo} value={periodo}>
                      {periodo}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {condicionesError && <p className="auth-card__error">{condicionesError}</p>}

            <div className="table__actions">
              <button type="submit" disabled={savingCondiciones}>
                {savingCondiciones ? 'Guardando…' : 'Guardar cambios'}
              </button>
              <button
                type="button"
                className="danger"
                onClick={() => eliminarArriendoConfirmar.pedir(true)}
              >
                Eliminar arriendo
              </button>
            </div>
          </form>
        </Modal>
      )}
      {eliminarArriendoConfirmar.modal}

      {esStaff && (
        <section>
          <div className="page-header">
            <h2>Documentos</h2>
            <button type="button" onClick={abrirModalDocumento}>
              + Subir documento
            </button>
          </div>

          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Tipo</th>
                  <th>Emitido</th>
                  <th>Vence</th>
                  <th>Archivo</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {documentos.map((doc) => (
                  <tr key={doc.id}>
                    <td>{doc.tipo}</td>
                    <td>{doc.fechaEmision ? formatFecha(doc.fechaEmision) : '—'}</td>
                    <td>{doc.fechaVencimiento ? formatFecha(doc.fechaVencimiento) : '—'}</td>
                    <td>
                      <a href={doc.archivoUrl} target="_blank" rel="noreferrer">
                        Ver
                      </a>
                    </td>
                    <td>
                      <div className="table__actions">
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => eliminarDocumentoConfirmar.pedir(doc.id)}
                        >
                          <IconEliminar />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {mostrarAgregarDocumento && (
            <Modal titulo="Subir documento" onClose={cerrarModalDocumento}>
              {documentoError && <p className="auth-card__error">{documentoError}</p>}
              {documentoRecienSubido ? (
                <div className="inline-form">
                  <p>Documento subido correctamente.</p>
                  <div className="page-header__actions">
                    <button type="button" onClick={agregarOtroDocumento}>
                      + Agregar otro documento
                    </button>
                    <button type="button" onClick={cerrarModalDocumento}>
                      Cerrar
                    </button>
                  </div>
                </div>
              ) : (
                <div className="inline-form">
                  <div className="inline-form__grid">
                    <label>
                      Tipo de documento
                      <select
                        value={documentoForm.tipo}
                        onChange={(e) =>
                          setDocumentoForm({ ...documentoForm, tipo: e.target.value })
                        }
                      >
                        <option value="">Elige un tipo…</option>
                        {DOCUMENTO_TIPOS_ARRIENDO.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </label>
                    {documentoForm.tipo === 'Otro' && (
                      <label>
                        Especifica el tipo
                        <input
                          value={documentoForm.tipoOtro}
                          onChange={(e) =>
                            setDocumentoForm({ ...documentoForm, tipoOtro: e.target.value })
                          }
                        />
                      </label>
                    )}
                    <label>
                      Fecha de emisión (opcional)
                      <input
                        type="date"
                        value={documentoForm.fechaEmision}
                        onChange={(e) =>
                          setDocumentoForm({ ...documentoForm, fechaEmision: e.target.value })
                        }
                      />
                    </label>
                    <label>
                      Fecha de vencimiento (opcional)
                      <input
                        type="date"
                        value={documentoForm.fechaVencimiento}
                        onChange={(e) =>
                          setDocumentoForm({ ...documentoForm, fechaVencimiento: e.target.value })
                        }
                      />
                    </label>
                  </div>

                  <div
                    className={`dropzone${arrastrandoDocumento ? ' dropzone--arrastrando' : ''}`}
                    onDragOver={(e) => {
                      e.preventDefault();
                      setArrastrandoDocumento(true);
                    }}
                    onDragLeave={() => setArrastrandoDocumento(false)}
                    onDrop={handleDropDocumento}
                  >
                    <span>Elige un archivo o arrástralo aquí</span>
                    <label className="button-like">
                      {subiendoDocumento ? 'Subiendo…' : '+ Subir documento'}
                      <input
                        type="file"
                        hidden
                        disabled={subiendoDocumento}
                        onChange={handleSubirDocumento}
                      />
                    </label>
                  </div>
                </div>
              )}
            </Modal>
          )}
        </section>
      )}

      {showPagoForm && (
        <Modal
          titulo={
            editingPagoId
              ? 'Editar pago'
              : `Registrar pago de ${CATEGORIA_PAGO_LABELS[pagoForm.categoria]}`
          }
          onClose={cerrarPagoForm}
        >
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
              {pagoForm.categoria === 'SERVICIOS_BASICOS' && (
                <label>
                  Servicio
                  <select
                    required
                    value={pagoForm.tipoServicio}
                    onChange={(e) =>
                      setPagoForm({
                        ...pagoForm,
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
              {pagoForm.categoria === 'SERVICIOS_BASICOS' && (
                <label>
                  Tipo de pago
                  <select
                    value={pagoForm.tipoPago}
                    onChange={(e) =>
                      setPagoForm({ ...pagoForm, tipoPago: e.target.value as 'completo' | 'abono' })
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
                  value={pagoForm.monto}
                  onChange={(e) => setPagoForm({ ...pagoForm, monto: e.target.value })}
                />
              </label>
              {pagoForm.categoria === 'ARRIENDO' && (
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
              )}
              {esStaff && (
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
              )}
            </div>

            {pagoError && <p className="auth-card__error">{pagoError}</p>}

            <button type="submit" disabled={savingPago}>
              {savingPago ? 'Guardando…' : editingPagoId ? 'Guardar cambios' : 'Guardar pago'}
            </button>
          </form>
        </Modal>
      )}

      <section id="pagos-arriendo">
        <div className="page-header">
          <h2>Pagos de arriendo</h2>
          <button type="button" onClick={() => abrirCreacionPago('ARRIENDO')}>
            + Registrar pago
          </button>
        </div>
        {renderTablaPagos(pagosArriendo, 'Sin pagos de arriendo registrados.')}
      </section>

      <section id="pagos-servicios">
        <div className="page-header">
          <h2>Pagos de servicios básicos</h2>
          <button type="button" onClick={() => abrirCreacionPago('SERVICIOS_BASICOS')}>
            + Registrar pago
          </button>
        </div>
        {renderTablaPagos(pagosServicios, 'Sin pagos de servicios básicos registrados.', true)}
      </section>

      <section>
        <div className="page-header">
          <h2>Requerimientos</h2>
          <button type="button" onClick={abrirCreacionReq}>
            + Reportar requerimiento
          </button>
        </div>

        {showReqForm && (
          <Modal
            titulo={editingReqId ? 'Editar requerimiento' : 'Reportar requerimiento'}
            onClose={cerrarReqForm}
          >
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
                      {personas
                        .filter((p) => p.tipoPersona === 'TECNICO' || p.id === reqForm.tecnicoId)
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.nombreCompleto}
                          </option>
                        ))}
                    </select>
                  </label>
                </>
              )}
            </div>

            {editingReqId && esStaff && (
              <label>
                Nota interna (uso interno del staff, el arrendatario no la ve)
                <textarea
                  placeholder="Ej. contacto del técnico, instrucciones de acceso, etc."
                  value={reqForm.notasInternas}
                  onChange={(e) => setReqForm({ ...reqForm, notasInternas: e.target.value })}
                />
              </label>
            )}

            <label>
              Descripción
              <textarea
                placeholder="Describe el problema…"
                value={reqForm.notasArrendatario}
                onChange={(e) => setReqForm({ ...reqForm, notasArrendatario: e.target.value })}
              />
            </label>

            {editingReqId && esStaff && reqForm.estado === 'RESUELTO' && (
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
          </Modal>
        )}

        {requerimientos.length === 0 && (
          <p className="empty-state">Sin requerimientos registrados.</p>
        )}
        {requerimientos.length > 0 && (
          <div className="table-wrap">
            <table className="table table--fixed">
              <thead>
                <tr>
                  <th style={{ width: '90px' }}>Urgencia</th>
                  <th style={{ width: '100px' }}>Tipo</th>
                  <th style={{ width: '130px' }}>Estado</th>
                  <th style={{ width: '150px' }}>Técnico</th>
                  <th>Descripción</th>
                  <th style={{ width: '120px' }}>{esStaff ? 'Acciones' : 'Historial'}</th>
                </tr>
              </thead>
              <tbody>
                {requerimientos.map((req) => {
                  const historialAbierto = historialAbiertoId === req.id;
                  return (
                    <Fragment key={req.id}>
                      <tr>
                        <td>
                          <span className={`badge badge--${req.urgencia.toLowerCase()}`}>
                            {req.urgencia}
                          </span>
                        </td>
                        <td>
                          <span className={`badge badge--${req.tipoReparacion.toLowerCase()}`}>
                            {req.tipoReparacion}
                          </span>
                        </td>
                        <td className="table__cell-wrap">
                          <span className={`badge badge--${req.estado.toLowerCase()}`}>
                            {req.estado.replace(/_/g, ' ')}
                          </span>
                        </td>
                        <td className="table__cell-wrap">{req.tecnico?.nombreCompleto ?? ''}</td>
                        <td className="table__cell-wrap">{req.notasArrendatario ?? ''}</td>
                        <td>
                          <div className="table__actions">
                            {esStaff &&
                              (req.estado === 'RESUELTO' || req.estado === 'RECHAZADO' ? (
                                <button type="button" onClick={() => handleReabrirReq(req.id)}>
                                  Reabrir
                                </button>
                              ) : (
                                <>
                                  <button
                                    type="button"
                                    className="icon-button"
                                    title="Editar"
                                    aria-label="Editar"
                                    onClick={() => abrirEdicionReq(req)}
                                  >
                                    <IconEditar />
                                  </button>
                                  <button
                                    type="button"
                                    className="icon-button icon-button--danger"
                                    title="Rechazar"
                                    aria-label="Rechazar"
                                    onClick={() => handleRechazarReq(req.id)}
                                  >
                                    <IconRechazar />
                                  </button>
                                </>
                              ))}
                            <HistorialRequerimientoBoton
                              actualizaciones={req.actualizaciones}
                              abierto={historialAbierto}
                              onToggle={() =>
                                setHistorialAbiertoId(historialAbierto ? null : req.id)
                              }
                            />
                          </div>
                        </td>
                      </tr>
                      {historialAbierto && (
                        <HistorialRequerimientoFilas actualizaciones={req.actualizaciones} colSpan={6} />
                      )}
                    </Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </section>
      {eliminarPagoConfirmar.modal}
      {eliminarDocumentoConfirmar.modal}
    </div>
  );
}
