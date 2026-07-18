import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { AUTOPISTAS_TAG, PERIODOS_PAGO_AUTO_LABELS } from '../api/types';
import type {
  ArriendoAuto,
  Auto,
  ConfiguracionMantencion,
  Documento,
  EstadoArriendo,
  EstadoAuto,
  EstadoPago,
  MantencionAuto,
  Pago,
  PagoVehiculo,
  PeriodoPagoAuto,
  Persona,
  QuienPago,
} from '../api/types';
import {
  ddmmyyyyToIso,
  formatEnumLabel,
  formatFecha,
  formatMonto,
  hoyDdmmyyyy,
  isoToDdmmyyyy,
} from '../lib/format';
import { DateInput } from '../components/DateInput';
import { Modal } from '../components/Modal';
import { IconCheck, IconEditar, IconEliminar, IconReloj } from '../components/icons';
import { MEDIOS_PAGO } from '../lib/periodos';
import { eliminarDocumento, listarDocumentos, subirDocumento } from '../lib/documentos';

const ESTADOS: EstadoAuto[] = ['DISPONIBLE', 'ARRENDADO', 'EN_MANTENCION'];
const ESTADOS_ARRIENDO: EstadoArriendo[] = ['ACTIVO', 'INACTIVO', 'TERMINADO'];

const FORM_INICIAL = { patente: '', marca: '', modelo: '', anio: '', kilometraje: '' };

const DOCUMENTO_TIPOS_AUTO = [
  'Padrón',
  'Permiso de circulación',
  'Revisión técnica',
  'SOAP',
  'Seguro',
  'Contrato de arriendo',
  'Otro',
];

const DOCUMENTO_FORM_INICIAL = {
  tipo: '',
  tipoOtro: '',
  fechaEmision: '',
  fechaVencimiento: '',
};

const MANTENCION_FORM_INICIAL = {
  configuracionIds: [] as string[],
  kilometrajeActual: '',
  kilometrajeProxima: '',
  fechaMantencion: '',
  costo: '',
  quienPago: '' as QuienPago | '',
  estadoPago: 'PENDIENTE' as EstadoPago,
};

const QUIENES_PAGO: QuienPago[] = ['PROPIETARIO', 'ARRENDATARIO'];

const NUEVA_CONFIG_INICIAL = { tipo: '', cadaKm: '' };

const ARRIENDO_FORM_INICIAL = {
  arrendatarioId: '',
  kilometrajeEntrega: '',
  kilometrajeRecepcion: '',
  periodoPago: 'MENSUAL' as PeriodoPagoAuto,
  fechaEntrega: '',
  periodoAlza: 'ANUAL',
  montoArriendo: '',
  estado: 'ACTIVO' as EstadoArriendo,
};

const PERIODOS_PAGO_AUTO: PeriodoPagoAuto[] = ['SEMANAL', 'DOS_SEMANAS', 'MENSUAL'];

// Aritmética de fechas en UTC (evita que setDate/setMonth se corran un día
// por el timezone local) para sugerir el siguiente período de pago.
function sumarDiasIso(fechaIso: string, dias: number): string {
  const [y, m, d] = fechaIso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1, d + dias)).toISOString().slice(0, 10);
}

function sumarMesesIso(fechaIso: string, meses: number): string {
  const [y, m, d] = fechaIso.slice(0, 10).split('-').map(Number);
  return new Date(Date.UTC(y, m - 1 + meses, d)).toISOString().slice(0, 10);
}

function calcularPeriodoHasta(periodoPago: PeriodoPagoAuto, desdeIso: string): string {
  if (periodoPago === 'SEMANAL') return sumarDiasIso(desdeIso, 6);
  if (periodoPago === 'DOS_SEMANAS') return sumarDiasIso(desdeIso, 13);
  return sumarDiasIso(sumarMesesIso(desdeIso, 1), -1);
}

const PERIODOS_ALZA = ['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'SIN REAJUSTE'] as const;

const ESTADOS_PAGO: EstadoPago[] = ['PENDIENTE', 'PAGADO', 'ATRASADO', 'RECHAZADO'];

const PAGO_FORM_INICIAL = {
  periodo: '',
  fechaComprometida: '',
  periodoHasta: '',
  kilometraje: '',
  monto: '',
  medioPago: '',
  tipoPago: 'arriendo' as 'arriendo' | 'abono' | 'garantia',
  estado: 'PENDIENTE' as EstadoPago,
};

const TAG_FORM_INICIAL = {
  autopista: '',
  numeroBoleta: '',
  fechaPago: '',
  monto: '',
};

const MULTA_FORM_INICIAL = {
  numeroBoleta: '',
  fechaPago: '',
  monto: '',
  estado: 'PENDIENTE' as EstadoPago,
  fechaPagoReal: '',
};

export function AutoDetailPage() {
  const { id } = useParams<{ id: string }>();

  const [auto, setAuto] = useState<Auto | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [personas, setPersonas] = useState<Persona[]>([]);
  const [configuraciones, setConfiguraciones] = useState<ConfiguracionMantencion[]>([]);

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [documentoForm, setDocumentoForm] = useState(DOCUMENTO_FORM_INICIAL);
  const [subiendoDocumento, setSubiendoDocumento] = useState(false);
  const [documentoError, setDocumentoError] = useState<string | null>(null);
  const [mostrarAgregarDocumento, setMostrarAgregarDocumento] = useState(false);
  const [documentoRecienSubido, setDocumentoRecienSubido] = useState(false);
  const [arrastrandoDocumento, setArrastrandoDocumento] = useState(false);

  const [mantenciones, setMantenciones] = useState<MantencionAuto[]>([]);
  const [mostrarTodoMantenciones, setMostrarTodoMantenciones] = useState(false);
  const [showMantencionForm, setShowMantencionForm] = useState(false);
  const [mantencionForm, setMantencionForm] = useState(MANTENCION_FORM_INICIAL);
  const [mantencionError, setMantencionError] = useState<string | null>(null);
  const [editingMantencionId, setEditingMantencionId] = useState<string | null>(null);
  const [showNuevaConfig, setShowNuevaConfig] = useState(false);
  const [nuevaConfigForm, setNuevaConfigForm] = useState(NUEVA_CONFIG_INICIAL);

  const [arriendosAuto, setArriendosAuto] = useState<ArriendoAuto[]>([]);
  const [showArriendoForm, setShowArriendoForm] = useState(false);
  const [arriendoForm, setArriendoForm] = useState(ARRIENDO_FORM_INICIAL);
  const [arriendoError, setArriendoError] = useState<string | null>(null);
  const [editingArriendoId, setEditingArriendoId] = useState<string | null>(null);

  const arriendoActivo =
    arriendosAuto.find((a) => a.estado === 'ACTIVO') ?? arriendosAuto[0] ?? null;
  const otrosArriendos = arriendosAuto.filter((a) => a.id !== arriendoActivo?.id);

  const [pagosAuto, setPagosAuto] = useState<Pago[]>([]);
  const [mostrarTodoPagosAuto, setMostrarTodoPagosAuto] = useState(false);
  const [showPagoForm, setShowPagoForm] = useState(false);
  const [pagoForm, setPagoForm] = useState(PAGO_FORM_INICIAL);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [editingPagoId, setEditingPagoId] = useState<string | null>(null);
  const [savingPago, setSavingPago] = useState(false);

  const [pagosVehiculo, setPagosVehiculo] = useState<PagoVehiculo[]>([]);
  const [mostrarTodoTag, setMostrarTodoTag] = useState(false);
  const [showTagForm, setShowTagForm] = useState(false);
  const [tagForm, setTagForm] = useState(TAG_FORM_INICIAL);
  const [tagError, setTagError] = useState<string | null>(null);
  const [editingTagId, setEditingTagId] = useState<string | null>(null);
  const [savingTag, setSavingTag] = useState(false);

  const [showAbonoForm, setShowAbonoForm] = useState(false);
  const [editingAbonoId, setEditingAbonoId] = useState<string | null>(null);
  const [fechaAbono, setFechaAbono] = useState('');
  const [montoAbono, setMontoAbono] = useState('');
  const [abonoError, setAbonoError] = useState<string | null>(null);
  const [savingAbono, setSavingAbono] = useState(false);

  const [showMultaForm, setShowMultaForm] = useState(false);
  const [multaForm, setMultaForm] = useState(MULTA_FORM_INICIAL);
  const [multaError, setMultaError] = useState<string | null>(null);
  const [editingMultaId, setEditingMultaId] = useState<string | null>(null);
  const [savingMulta, setSavingMulta] = useState(false);

  const cargarAuto = () => {
    if (!id) return;
    setLoading(true);
    api
      .get<Auto>(`/autos/${id}`)
      .then(setAuto)
      .catch(() => setError('No se pudo cargar el auto'))
      .finally(() => setLoading(false));
  };

  const cargarMantenciones = () => {
    if (!id) return;
    api.get<MantencionAuto[]>(`/autos/${id}/mantenciones`).then(setMantenciones);
  };

  const cargarArriendos = () => {
    if (!id) return;
    api.get<ArriendoAuto[]>(`/arriendos-auto?autoId=${id}`).then(setArriendosAuto);
  };

  const cargarPagosVehiculo = () => {
    if (!id) return;
    api.get<PagoVehiculo[]>(`/autos/${id}/pagos-vehiculo`).then(setPagosVehiculo);
  };

  const cargarDocumentosAuto = () => {
    if (!id) return;
    listarDocumentos('auto', id).then(setDocumentos);
  };

  useEffect(cargarAuto, [id]);
  useEffect(cargarMantenciones, [id]);
  useEffect(cargarArriendos, [id]);
  useEffect(cargarPagosVehiculo, [id]);
  useEffect(cargarDocumentosAuto, [id]);
  useEffect(() => {
    api.get<Persona[]>('/personas').then(setPersonas);
    api.get<ConfiguracionMantencion[]>('/configuraciones-mantencion').then(setConfiguraciones);
  }, []);

  useEffect(() => {
    if (!arriendoActivo) {
      setPagosAuto([]);
      return;
    }
    api.get<Pago[]>(`/pagos?arriendoTipo=auto&arriendoId=${arriendoActivo.id}`).then(setPagosAuto);
  }, [arriendoActivo?.id]);

  const cargarPagosAuto = () => {
    if (!arriendoActivo) return;
    api.get<Pago[]>(`/pagos?arriendoTipo=auto&arriendoId=${arriendoActivo.id}`).then(setPagosAuto);
  };

  const subirArchivoDocumentoAuto = async (archivo: File) => {
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
        'auto',
        id,
        documentoForm.fechaEmision || undefined,
        documentoForm.fechaVencimiento || undefined,
      );
      setDocumentoForm(DOCUMENTO_FORM_INICIAL);
      setDocumentoRecienSubido(true);
      cargarDocumentosAuto();
    } catch (err) {
      setDocumentoError(err instanceof ApiError ? err.message : 'No se pudo subir el documento');
    } finally {
      setSubiendoDocumento(false);
    }
  };

  const handleSubirDocumentoAuto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (archivo) subirArchivoDocumentoAuto(archivo);
  };

  const handleDropDocumentoAuto = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastrandoDocumento(false);
    const archivo = event.dataTransfer.files?.[0];
    if (archivo) subirArchivoDocumentoAuto(archivo);
  };

  const handleEliminarDocumentoAuto = async (documentoId: string) => {
    await eliminarDocumento(documentoId);
    setDocumentos((prev) => prev.filter((d) => d.id !== documentoId));
  };

  const abrirModalDocumentoAuto = () => {
    setDocumentoForm(DOCUMENTO_FORM_INICIAL);
    setDocumentoError(null);
    setDocumentoRecienSubido(false);
    setMostrarAgregarDocumento(true);
  };

  const cerrarModalDocumentoAuto = () => {
    setMostrarAgregarDocumento(false);
    setDocumentoRecienSubido(false);
    setDocumentoForm(DOCUMENTO_FORM_INICIAL);
    setDocumentoError(null);
  };

  const agregarOtroDocumentoAuto = () => {
    setDocumentoForm(DOCUMENTO_FORM_INICIAL);
    setDocumentoError(null);
    setDocumentoRecienSubido(false);
  };

  const cerrarForm = () => {
    setShowForm(false);
    setFormError(null);
  };

  const abrirEdicion = () => {
    if (!auto) return;
    setForm({
      patente: auto.patente,
      marca: auto.marca ?? '',
      modelo: auto.modelo ?? '',
      anio: auto.anio != null ? String(auto.anio) : '',
      kilometraje: String(auto.kilometraje),
    });
    setFormError(null);
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!id) return;
    setFormError(null);
    setSaving(true);
    try {
      await api.patch(`/autos/${id}`, {
        patente: form.patente.toUpperCase(),
        marca: form.marca || undefined,
        modelo: form.modelo || undefined,
        anio: form.anio ? Number(form.anio) : undefined,
        kilometraje: Number(form.kilometraje),
      });
      cerrarForm();
      cargarAuto();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo guardar el auto');
    } finally {
      setSaving(false);
    }
  };

  const cambiarEstadoAuto = async (estado: string) => {
    if (!id) return;
    await api.patch(`/autos/${id}`, { estado });
    cargarAuto();
  };

  // --- Mantenciones ---

  const MANTENCION_LIMITE_VISIBLE = 3;
  const mantencionesVisibles = mostrarTodoMantenciones
    ? mantenciones
    : mantenciones.slice(0, MANTENCION_LIMITE_VISIBLE);

  const abrirCreacionMantencion = () => {
    setEditingMantencionId(null);
    setMantencionError(null);
    setMantencionForm(MANTENCION_FORM_INICIAL);
    setShowMantencionForm(true);
  };

  const abrirEdicionMantencion = (mantencion: MantencionAuto) => {
    setEditingMantencionId(mantencion.id);
    setMantencionError(null);
    setMantencionForm({
      configuracionIds: mantencion.items.map((item) => item.configuracionId),
      kilometrajeActual: String(mantencion.kilometrajeActual),
      kilometrajeProxima: mantencion.kilometrajeProxima ? String(mantencion.kilometrajeProxima) : '',
      fechaMantencion: isoToDdmmyyyy(mantencion.fechaMantencion),
      costo: mantencion.costo ?? '',
      quienPago: mantencion.quienPago ?? '',
      estadoPago: mantencion.estadoPago,
    });
    setShowMantencionForm(true);
  };

  const toggleTipoMantencion = (configuracionId: string) => {
    setMantencionForm((prev) => ({
      ...prev,
      configuracionIds: prev.configuracionIds.includes(configuracionId)
        ? prev.configuracionIds.filter((cid) => cid !== configuracionId)
        : [...prev.configuracionIds, configuracionId],
    }));
  };

  const cancelarEdicionMantencion = () => {
    setShowMantencionForm(false);
    setEditingMantencionId(null);
    setMantencionForm(MANTENCION_FORM_INICIAL);
    setMantencionError(null);
  };

  const handleCrearConfiguracion = async () => {
    if (!nuevaConfigForm.tipo.trim() || !nuevaConfigForm.cadaKm.trim()) return;
    const nueva = await api.post<ConfiguracionMantencion>('/configuraciones-mantencion', {
      tipo: nuevaConfigForm.tipo,
      cadaKm: Number(nuevaConfigForm.cadaKm),
    });
    const lista = await api.get<ConfiguracionMantencion[]>('/configuraciones-mantencion');
    setConfiguraciones(lista);
    setMantencionForm({ ...mantencionForm, configuracionIds: [...mantencionForm.configuracionIds, nueva.id] });
    setNuevaConfigForm(NUEVA_CONFIG_INICIAL);
    setShowNuevaConfig(false);
  };

  const handleGuardarMantencion = async () => {
    if (!id) return;
    if (
      mantencionForm.configuracionIds.length === 0 ||
      !mantencionForm.kilometrajeActual ||
      !mantencionForm.fechaMantencion
    ) {
      setMantencionError('Elige al menos un tipo de mantención, el km actual y la fecha.');
      return;
    }

    const fechaMantencion = ddmmyyyyToIso(mantencionForm.fechaMantencion);
    if (!fechaMantencion) {
      setMantencionError('Fecha inválida, usa el formato dd/mm/aaaa.');
      return;
    }
    setMantencionError(null);

    const payload = {
      configuracionIds: mantencionForm.configuracionIds,
      kilometrajeActual: Number(mantencionForm.kilometrajeActual),
      kilometrajeProxima: mantencionForm.kilometrajeProxima
        ? Number(mantencionForm.kilometrajeProxima)
        : undefined,
      fechaMantencion,
      costo: mantencionForm.costo ? Number(mantencionForm.costo) : undefined,
      quienPago: mantencionForm.quienPago || undefined,
      estadoPago: mantencionForm.estadoPago,
    };

    if (editingMantencionId) {
      await api.patch(`/autos/${id}/mantenciones/${editingMantencionId}`, payload);
    } else {
      await api.post(`/autos/${id}/mantenciones`, payload);
    }

    setShowMantencionForm(false);
    setEditingMantencionId(null);
    setMantencionForm(MANTENCION_FORM_INICIAL);
    cargarMantenciones();
  };

  const handleDeleteMantencion = async (mantencionId: string) => {
    if (!id) return;
    await api.delete(`/autos/${id}/mantenciones/${mantencionId}`);
    if (editingMantencionId === mantencionId) cancelarEdicionMantencion();
    setMantenciones((prev) => prev.filter((m) => m.id !== mantencionId));
  };

  const handleAprobarMantencion = async (mantencionId: string) => {
    if (!id) return;
    await api.patch(`/autos/${id}/mantenciones/${mantencionId}`, {
      aprobado: true,
      estadoPago: 'PAGADO',
    });
    cargarMantenciones();
  };

  const handleRechazarMantencion = async (mantencionId: string) => {
    if (!id) return;
    const motivoRechazo = prompt('Motivo del rechazo:');
    if (motivoRechazo === null) return;
    if (!motivoRechazo.trim()) {
      alert('Debes indicar un motivo de rechazo.');
      return;
    }
    await api.patch(`/autos/${id}/mantenciones/${mantencionId}`, {
      aprobado: false,
      estadoPago: 'RECHAZADO',
      motivoRechazo: motivoRechazo.trim(),
    });
    cargarMantenciones();
  };

  // --- Arrendatario ---

  const abrirCreacionArriendo = () => {
    setEditingArriendoId(null);
    setArriendoError(null);
    setArriendoForm(ARRIENDO_FORM_INICIAL);
    setShowArriendoForm(true);
  };

  const abrirEdicionArriendo = (arriendo: ArriendoAuto) => {
    setEditingArriendoId(arriendo.id);
    setArriendoError(null);
    setArriendoForm({
      arrendatarioId: arriendo.arrendatarioId,
      kilometrajeEntrega: String(arriendo.kilometrajeEntrega),
      kilometrajeRecepcion: arriendo.kilometrajeRecepcion ? String(arriendo.kilometrajeRecepcion) : '',
      periodoPago: arriendo.periodoPago,
      fechaEntrega: isoToDdmmyyyy(arriendo.fechaEntrega),
      periodoAlza: arriendo.periodoAlza,
      montoArriendo: arriendo.montoArriendo,
      estado: arriendo.estado,
    });
    setShowArriendoForm(true);
  };

  const cancelarEdicionArriendo = () => {
    setShowArriendoForm(false);
    setEditingArriendoId(null);
    setArriendoForm(ARRIENDO_FORM_INICIAL);
    setArriendoError(null);
  };

  const handleGuardarArriendo = async () => {
    if (!id) return;
    if (
      !arriendoForm.arrendatarioId ||
      !arriendoForm.kilometrajeEntrega ||
      !arriendoForm.periodoPago ||
      !arriendoForm.fechaEntrega ||
      !arriendoForm.montoArriendo
    ) {
      setArriendoError('Completa el arrendatario y las condiciones del arriendo.');
      return;
    }
    const fechaEntrega = ddmmyyyyToIso(arriendoForm.fechaEntrega);
    if (!fechaEntrega) {
      setArriendoError('Fecha de entrega inválida, usa el formato dd/mm/aaaa.');
      return;
    }
    setArriendoError(null);

    if (editingArriendoId) {
      await api.patch(`/arriendos-auto/${editingArriendoId}`, {
        arrendatarioId: arriendoForm.arrendatarioId,
        kilometrajeEntrega: Number(arriendoForm.kilometrajeEntrega),
        kilometrajeRecepcion: arriendoForm.kilometrajeRecepcion
          ? Number(arriendoForm.kilometrajeRecepcion)
          : undefined,
        periodoPago: arriendoForm.periodoPago,
        fechaEntrega,
        periodoAlza: arriendoForm.periodoAlza,
        montoArriendo: Number(arriendoForm.montoArriendo),
        estado: arriendoForm.estado,
      });
    } else {
      await api.post('/arriendos-auto', {
        autoId: id,
        arrendatarioId: arriendoForm.arrendatarioId,
        kilometrajeEntrega: Number(arriendoForm.kilometrajeEntrega),
        periodoPago: arriendoForm.periodoPago,
        fechaEntrega,
        periodoAlza: arriendoForm.periodoAlza,
        montoArriendo: Number(arriendoForm.montoArriendo),
      });
    }

    setShowArriendoForm(false);
    setEditingArriendoId(null);
    setArriendoForm(ARRIENDO_FORM_INICIAL);
    cargarArriendos();
    cargarAuto();
  };

  const handleDeleteArriendo = async (arriendoId: string) => {
    await api.delete(`/arriendos-auto/${arriendoId}`);
    if (editingArriendoId === arriendoId) cancelarEdicionArriendo();
    setArriendosAuto((prev) => prev.filter((a) => a.id !== arriendoId));
  };

  // --- Pagos de arriendo ---

  const PAGOS_AUTO_LIMITE_VISIBLE = 3;
  const pagosAutoOrdenados = [...pagosAuto].sort((a, b) => b.periodo.localeCompare(a.periodo));
  const pagosAutoVisibles = mostrarTodoPagosAuto
    ? pagosAutoOrdenados
    : pagosAutoOrdenados.slice(0, PAGOS_AUTO_LIMITE_VISIBLE);

  const montoRecaudadoTotal = pagosAuto
    .filter((p) => p.estado === 'PAGADO')
    .reduce((acc, p) => acc + Number(p.monto), 0);

  const diasArriendoTotal = pagosAuto.reduce((acc, p) => {
    if (!p.periodoHasta) return acc;
    const dias =
      Math.round(
        (new Date(p.periodoHasta).getTime() - new Date(p.fechaComprometida).getTime()) / 86400000,
      ) + 1;
    return acc + dias;
  }, 0);

  const ultimoKilometrajeRegistrado =
    pagosAutoOrdenados.find((p) => p.kilometraje != null)?.kilometraje ?? null;

  const abrirCreacionPago = () => {
    setEditingPagoId(null);
    setPagoError(null);
    let fechaComprometida = '';
    let periodoHasta = '';
    if (arriendoActivo) {
      // Sugiere el siguiente período a partir de dónde quedó el último
      // (ignora garantía, que no tiene periodoHasta) y de la frecuencia
      // pactada en las condiciones del arriendo.
      const pagosConPeriodo = pagosAuto.filter((p): p is Pago & { periodoHasta: string } =>
        Boolean(p.periodoHasta),
      );
      const ultimoPeriodoHasta = pagosConPeriodo.length
        ? pagosConPeriodo.reduce((max, p) => (p.periodoHasta > max ? p.periodoHasta : max), '')
        : null;
      const desdeIso = ultimoPeriodoHasta
        ? sumarDiasIso(ultimoPeriodoHasta, 1)
        : arriendoActivo.fechaEntrega;
      const hastaIso = calcularPeriodoHasta(arriendoActivo.periodoPago, desdeIso);
      fechaComprometida = isoToDdmmyyyy(desdeIso);
      periodoHasta = isoToDdmmyyyy(hastaIso);
    }
    setPagoForm({
      ...PAGO_FORM_INICIAL,
      periodo: hoyDdmmyyyy(),
      fechaComprometida,
      periodoHasta,
    });
    setShowPagoForm(true);
  };

  const tipoPagoDePago = (pago: Pago): 'arriendo' | 'abono' | 'garantia' =>
    pago.categoria === 'GARANTIA' ? 'garantia' : pago.esAbono ? 'abono' : 'arriendo';

  const abrirEdicionPago = (pago: Pago) => {
    setEditingPagoId(pago.id);
    setPagoError(null);
    setPagoForm({
      periodo: isoToDdmmyyyy(pago.periodo),
      fechaComprometida: isoToDdmmyyyy(pago.fechaComprometida),
      periodoHasta: pago.periodoHasta ? isoToDdmmyyyy(pago.periodoHasta) : '',
      kilometraje: pago.kilometraje != null ? String(pago.kilometraje) : '',
      monto: pago.monto,
      medioPago: pago.medioPago ?? '',
      tipoPago: tipoPagoDePago(pago),
      estado: pago.estado,
    });
    setShowPagoForm(true);
  };

  const cancelarEdicionPago = () => {
    setShowPagoForm(false);
    setEditingPagoId(null);
    setPagoForm(PAGO_FORM_INICIAL);
    setPagoError(null);
  };

  const handleGuardarPago = async () => {
    if (!arriendoActivo) return;
    const esGarantia = pagoForm.tipoPago === 'garantia';
    const periodo = ddmmyyyyToIso(pagoForm.periodo);
    // La garantía no tiene periodo de arriendo asociado: se guarda con la
    // misma fecha de pago como fechaComprometida (campo obligatorio en la
    // base de datos) y sin periodoHasta.
    const fechaComprometida = esGarantia ? periodo : ddmmyyyyToIso(pagoForm.fechaComprometida);
    const periodoHasta = esGarantia ? undefined : ddmmyyyyToIso(pagoForm.periodoHasta);
    if (!periodo || !fechaComprometida || (!esGarantia && !periodoHasta)) {
      setPagoError('Revisa las fechas, deben tener el formato dd/mm/aaaa.');
      return;
    }
    if (!pagoForm.medioPago) {
      setPagoError('Elige el medio de pago.');
      return;
    }
    setPagoError(null);
    setSavingPago(true);
    const esAbono = pagoForm.tipoPago === 'abono';
    const categoria = esGarantia ? 'GARANTIA' : 'ARRIENDO';
    try {
      if (editingPagoId) {
        await api.patch(`/pagos/${editingPagoId}`, {
          periodo,
          fechaComprometida,
          periodoHasta,
          kilometraje: pagoForm.kilometraje ? Number(pagoForm.kilometraje) : undefined,
          monto: Number(pagoForm.monto),
          medioPago: pagoForm.medioPago,
          esAbono,
          categoria,
          estado: pagoForm.estado,
        });
      } else {
        await api.post('/pagos', {
          arriendoTipo: 'auto',
          arriendoId: arriendoActivo.id,
          periodo,
          fechaComprometida,
          periodoHasta,
          kilometraje: pagoForm.kilometraje ? Number(pagoForm.kilometraje) : undefined,
          monto: Number(pagoForm.monto),
          medioPago: pagoForm.medioPago,
          esAbono,
          categoria,
        });
      }
      cancelarEdicionPago();
      cargarPagosAuto();
    } catch (err) {
      setPagoError(err instanceof ApiError ? err.message : 'No se pudo guardar el pago');
    } finally {
      setSavingPago(false);
    }
  };

  const handleDeletePago = async (pagoId: string) => {
    await api.delete(`/pagos/${pagoId}`);
    setPagosAuto((prev) => prev.filter((p) => p.id !== pagoId));
  };

  const handleAprobarPago = async (pagoId: string) => {
    await api.patch(`/pagos/${pagoId}`, { aprobado: true, estado: 'PAGADO' });
    cargarPagosAuto();
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
    cargarPagosAuto();
  };

  // --- Tag ---

  const abrirCreacionTag = () => {
    setEditingTagId(null);
    setTagError(null);
    setTagForm(TAG_FORM_INICIAL);
    setShowTagForm(true);
  };

  const abrirEdicionTag = (pago: PagoVehiculo) => {
    setEditingTagId(pago.id);
    setTagError(null);
    setTagForm({
      autopista: pago.autopista ?? '',
      numeroBoleta: pago.numeroBoleta ?? '',
      fechaPago: isoToDdmmyyyy(pago.fechaPago),
      monto: pago.monto,
    });
    setShowTagForm(true);
  };

  const cancelarEdicionTag = () => {
    setShowTagForm(false);
    setEditingTagId(null);
    setTagForm(TAG_FORM_INICIAL);
    setTagError(null);
  };

  const handleGuardarTag = async () => {
    if (!id) return;
    const fechaPago = ddmmyyyyToIso(tagForm.fechaPago);
    if (!fechaPago || !tagForm.monto || !tagForm.autopista || !tagForm.numeroBoleta) {
      setTagError('Completa la autopista, el número de boleta, la fecha y el monto.');
      return;
    }
    setTagError(null);
    setSavingTag(true);
    try {
      const payload = {
        tipo: 'TAG' as const,
        autopista: tagForm.autopista,
        numeroBoleta: tagForm.numeroBoleta,
        periodicidad: 'MENSUAL' as const,
        monto: Number(tagForm.monto),
        fechaPago,
      };
      if (editingTagId) {
        await api.patch(`/autos/${id}/pagos-vehiculo/${editingTagId}`, payload);
      } else {
        await api.post(`/autos/${id}/pagos-vehiculo`, payload);
      }
      cancelarEdicionTag();
      cargarPagosVehiculo();
    } catch (err) {
      setTagError(err instanceof ApiError ? err.message : 'No se pudo guardar el pago de TAG');
    } finally {
      setSavingTag(false);
    }
  };

  const handleDeleteTag = async (pagoId: string) => {
    if (!id) return;
    await api.delete(`/autos/${id}/pagos-vehiculo/${pagoId}`);
    cargarPagosVehiculo();
  };

  // --- Abono de boletas TAG ---
  // El abono es un pago general contra la deuda total del Tag: no se elige
  // a qué boletas corresponde, solo se registra cuánto y cuándo se pagó.

  const pagosTag = pagosVehiculo.filter((p) => p.tipo === 'TAG');
  const boletasFacturadas = pagosTag.filter((p) => !p.esAbono);
  const abonosTag = pagosTag.filter((p) => p.esAbono);
  const montoFacturado = boletasFacturadas.reduce((acc, p) => acc + Number(p.monto), 0);
  const montoPagadoTag = abonosTag.reduce((acc, p) => acc + Number(p.monto), 0);

  // Saldo pendiente al momento de cada abono: boletas cobradas hasta esa
  // fecha (inclusive) menos los abonos pagados hasta esa fecha (inclusive)
  // — no el total final, sino cómo iba quedando la deuda en ese punto.
  const pendienteAlMomentoDelAbono = new Map<string, number>();
  {
    let cargoAcumulado = 0;
    let pagoAcumulado = 0;
    for (const p of [...pagosTag].sort((a, b) => a.fechaPago.localeCompare(b.fechaPago))) {
      if (p.esAbono) {
        pagoAcumulado += Number(p.monto);
        pendienteAlMomentoDelAbono.set(p.id, cargoAcumulado - pagoAcumulado);
      } else {
        cargoAcumulado += Number(p.monto);
      }
    }
  }

  const pagosTagOrdenados = [...pagosTag].sort((a, b) => b.fechaPago.localeCompare(a.fechaPago));
  const TAG_LIMITE_VISIBLE = 3;
  const pagosTagVisibles = mostrarTodoTag
    ? pagosTagOrdenados
    : pagosTagOrdenados.slice(0, TAG_LIMITE_VISIBLE);

  const abrirAbono = () => {
    setEditingAbonoId(null);
    setFechaAbono(hoyDdmmyyyy());
    setMontoAbono('');
    setAbonoError(null);
    setShowAbonoForm(true);
  };

  const abrirEdicionAbono = (abono: PagoVehiculo) => {
    setEditingAbonoId(abono.id);
    setFechaAbono(isoToDdmmyyyy(abono.fechaPago));
    setMontoAbono(abono.monto);
    setAbonoError(null);
    setShowAbonoForm(true);
  };

  const cerrarAbono = () => {
    setShowAbonoForm(false);
    setEditingAbonoId(null);
    setFechaAbono('');
    setMontoAbono('');
    setAbonoError(null);
  };

  const handleRegistrarAbono = async () => {
    if (!id) return;
    const fechaPago = ddmmyyyyToIso(fechaAbono);
    if (!fechaPago) {
      setAbonoError('Fecha inválida, usa el formato dd/mm/aaaa.');
      return;
    }
    const montoTotal = Number(montoAbono);
    if (!montoTotal || montoTotal <= 0) {
      setAbonoError('Ingresa el monto del abono.');
      return;
    }
    setAbonoError(null);
    setSavingAbono(true);
    try {
      if (editingAbonoId) {
        await api.patch(`/autos/${id}/pagos-vehiculo/${editingAbonoId}`, {
          monto: montoTotal,
          fechaPago,
        });
      } else {
        await api.post(`/autos/${id}/pagos-vehiculo`, {
          tipo: 'TAG',
          periodicidad: 'MENSUAL',
          monto: montoTotal,
          fechaPago,
          pagado: true,
          esAbono: true,
        });
      }
      cerrarAbono();
      cargarPagosVehiculo();
    } catch (err) {
      setAbonoError(err instanceof ApiError ? err.message : 'No se pudo registrar el abono');
    } finally {
      setSavingAbono(false);
    }
  };

  // --- Multas ---

  const pagosMulta = pagosVehiculo.filter((p) => p.tipo === 'MULTA');

  const abrirCreacionMulta = () => {
    setEditingMultaId(null);
    setMultaError(null);
    setMultaForm(MULTA_FORM_INICIAL);
    setShowMultaForm(true);
  };

  const abrirEdicionMulta = (pago: PagoVehiculo) => {
    setEditingMultaId(pago.id);
    setMultaError(null);
    setMultaForm({
      numeroBoleta: pago.numeroBoleta ?? '',
      fechaPago: isoToDdmmyyyy(pago.fechaPago),
      monto: pago.monto,
      estado: pago.estado,
      fechaPagoReal: pago.fechaPagoReal ? isoToDdmmyyyy(pago.fechaPagoReal) : '',
    });
    setShowMultaForm(true);
  };

  const cancelarEdicionMulta = () => {
    setShowMultaForm(false);
    setEditingMultaId(null);
    setMultaForm(MULTA_FORM_INICIAL);
    setMultaError(null);
  };

  const handleGuardarMulta = async () => {
    if (!id) return;
    const fechaPago = ddmmyyyyToIso(multaForm.fechaPago);
    if (!fechaPago || !multaForm.monto) {
      setMultaError('Completa la fecha y el monto.');
      return;
    }
    setMultaError(null);
    setSavingMulta(true);
    try {
      const fechaPagoReal = multaForm.fechaPagoReal
        ? ddmmyyyyToIso(multaForm.fechaPagoReal)
        : undefined;
      const payload = {
        tipo: 'MULTA' as const,
        numeroBoleta: multaForm.numeroBoleta || undefined,
        periodicidad: 'MENSUAL' as const,
        monto: Number(multaForm.monto),
        fechaPago,
        estado: multaForm.estado,
        fechaPagoReal,
      };
      if (editingMultaId) {
        await api.patch(`/autos/${id}/pagos-vehiculo/${editingMultaId}`, payload);
      } else {
        await api.post(`/autos/${id}/pagos-vehiculo`, payload);
      }
      cancelarEdicionMulta();
      cargarPagosVehiculo();
    } catch (err) {
      setMultaError(err instanceof ApiError ? err.message : 'No se pudo guardar la multa');
    } finally {
      setSavingMulta(false);
    }
  };

  const handleDeleteMulta = async (pagoId: string) => {
    if (!id) return;
    await api.delete(`/autos/${id}/pagos-vehiculo/${pagoId}`);
    cargarPagosVehiculo();
  };

  if (loading) return <p>Cargando…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!auto) return null;

  return (
    <div>
      <Link to="/autos" className="back-link">
        ← Volver a autos
      </Link>

      <div className="page-header">
        <h1>{auto.patente}</h1>
        <select
          className={`cell-select badge badge--${auto.estado.toLowerCase()}`}
          value={auto.estado}
          onChange={(e) => cambiarEstadoAuto(e.target.value)}
        >
          {ESTADOS.map((estado) => (
            <option key={estado} value={estado}>
              {formatEnumLabel(estado)}
            </option>
          ))}
        </select>
      </div>

      {showForm && (
        <Modal titulo="Editar auto" onClose={cerrarForm}>
          <form className="inline-form" onSubmit={handleSubmit}>
            <div className="inline-form__grid">
              <label>
                Patente
                <input
                  required
                  value={form.patente}
                  onChange={(e) => setForm({ ...form, patente: e.target.value })}
                />
              </label>
              <label>
                Marca
                <input value={form.marca} onChange={(e) => setForm({ ...form, marca: e.target.value })} />
              </label>
              <label>
                Modelo
                <input
                  value={form.modelo}
                  onChange={(e) => setForm({ ...form, modelo: e.target.value })}
                />
              </label>
              <label>
                Año
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={form.anio}
                  onChange={(e) => setForm({ ...form, anio: e.target.value })}
                />
              </label>
              <label>
                Kilometraje
                <input
                  type="number"
                  min={0}
                  required
                  value={form.kilometraje}
                  onChange={(e) => setForm({ ...form, kilometraje: e.target.value })}
                />
              </label>
            </div>

            {formError && <p className="auth-card__error">{formError}</p>}

            <button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        </Modal>
      )}

      <section className="detail-grid">
        <div className="detail-card">
          <h2>Auto</h2>
          <p>Patente: {auto.patente}</p>
          <p>Marca: {auto.marca ?? '—'}</p>
          <p>Modelo: {auto.modelo ?? '—'}</p>
          <p>Año: {auto.anio ?? '—'}</p>
          <p>Último kilometraje registrado: {auto.kilometraje.toLocaleString('es-CL')} km</p>
          <button type="button" className="link-button" onClick={abrirEdicion}>
            Editar auto
          </button>
        </div>

        <div className="detail-card">
          <h2>Arrendatario</h2>
          {arriendoActivo ? (
            <>
              <p>{arriendoActivo.arrendatario.nombreCompleto}</p>
              {arriendoActivo.arrendatario.rut && <p>{arriendoActivo.arrendatario.rut}</p>}
              {arriendoActivo.arrendatario.email && <p>{arriendoActivo.arrendatario.email}</p>}
              <button
                type="button"
                className="link-button"
                onClick={() => abrirEdicionArriendo(arriendoActivo)}
              >
                Editar arrendatario
              </button>
            </>
          ) : (
            <>
              <p className="empty-state">Sin arrendatario registrado.</p>
              <button type="button" className="link-button" onClick={abrirCreacionArriendo}>
                + Agregar arrendatario
              </button>
            </>
          )}
        </div>

        <div className="detail-card">
          <h2>Condiciones</h2>
          {arriendoActivo ? (
            <>
              <p>Monto: {formatMonto(arriendoActivo.montoArriendo)}/mes</p>
              <p>Periodo de pago: {PERIODOS_PAGO_AUTO_LABELS[arriendoActivo.periodoPago]}</p>
              <p>Entrega: {formatFecha(arriendoActivo.fechaEntrega)}</p>
              <p>Reajuste: {arriendoActivo.periodoAlza}</p>
              <p>Kilometraje entrega: {arriendoActivo.kilometrajeEntrega.toLocaleString('es-CL')} km</p>
              {arriendoActivo.kilometrajeRecepcion && (
                <p>
                  Kilometraje recepción:{' '}
                  {arriendoActivo.kilometrajeRecepcion.toLocaleString('es-CL')} km
                </p>
              )}
              <p>
                Estado:{' '}
                <span className={`badge badge--${arriendoActivo.estado.toLowerCase()}`}>
                  {arriendoActivo.estado}
                </span>
              </p>
              <button
                type="button"
                className="link-button"
                onClick={() => abrirEdicionArriendo(arriendoActivo)}
              >
                Editar condiciones
              </button>
            </>
          ) : (
            <p className="empty-state">Sin condiciones registradas.</p>
          )}
        </div>
      </section>

      <section>
        <div className="page-header">
          <h2>Documentos</h2>
          <button type="button" onClick={abrirModalDocumentoAuto}>
            + Subir documento
          </button>
        </div>

        {documentos.length === 0 && <p className="empty-state">Sin documentos registrados.</p>}

        {documentos.length > 0 && (
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
                          onClick={() => handleEliminarDocumentoAuto(doc.id)}
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
        )}

        {mostrarAgregarDocumento && (
          <Modal titulo="Subir documento" onClose={cerrarModalDocumentoAuto}>
            {documentoError && <p className="auth-card__error">{documentoError}</p>}
            {documentoRecienSubido ? (
              <div className="inline-form">
                <p>Documento subido correctamente.</p>
                <div className="page-header__actions">
                  <button type="button" onClick={agregarOtroDocumentoAuto}>
                    + Agregar otro documento
                  </button>
                  <button type="button" onClick={cerrarModalDocumentoAuto}>
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
                      onChange={(e) => setDocumentoForm({ ...documentoForm, tipo: e.target.value })}
                    >
                      <option value="">Elige un tipo…</option>
                      {DOCUMENTO_TIPOS_AUTO.map((t) => (
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
                  onDrop={handleDropDocumentoAuto}
                >
                  <span>Elige un archivo o arrástralo aquí</span>
                  <label className="button-like">
                    {subiendoDocumento ? 'Subiendo…' : '+ Subir documento'}
                    <input
                      type="file"
                      hidden
                      disabled={subiendoDocumento}
                      onChange={handleSubirDocumentoAuto}
                    />
                  </label>
                </div>
              </div>
            )}
          </Modal>
        )}
      </section>

      {showArriendoForm && (
        <Modal
          titulo={editingArriendoId ? 'Editar arrendatario' : 'Agregar arrendatario'}
          onClose={cancelarEdicionArriendo}
        >
          <div className="inline-form">
            {arriendoError && <p className="auth-card__error">{arriendoError}</p>}
            <div className="inline-form__grid">
              <label>
                Arrendatario
                <select
                  value={arriendoForm.arrendatarioId}
                  onChange={(e) => setArriendoForm({ ...arriendoForm, arrendatarioId: e.target.value })}
                >
                  <option value="">Arrendatario…</option>
                  {personas.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.nombreCompleto}
                      {p.rut ? ` (${p.rut})` : ''}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Km entrega
                <input
                  type="number"
                  min={0}
                  value={arriendoForm.kilometrajeEntrega}
                  onChange={(e) =>
                    setArriendoForm({ ...arriendoForm, kilometrajeEntrega: e.target.value })
                  }
                />
              </label>
              <label>
                Periodo de pago
                <select
                  value={arriendoForm.periodoPago}
                  onChange={(e) =>
                    setArriendoForm({
                      ...arriendoForm,
                      periodoPago: e.target.value as PeriodoPagoAuto,
                    })
                  }
                >
                  {PERIODOS_PAGO_AUTO.map((periodo) => (
                    <option key={periodo} value={periodo}>
                      {PERIODOS_PAGO_AUTO_LABELS[periodo]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Fecha de entrega
                <DateInput
                  value={arriendoForm.fechaEntrega}
                  onChange={(value) => setArriendoForm({ ...arriendoForm, fechaEntrega: value })}
                />
              </label>
              <label>
                Periodo de reajuste
                <select
                  value={arriendoForm.periodoAlza}
                  onChange={(e) => setArriendoForm({ ...arriendoForm, periodoAlza: e.target.value })}
                >
                  {PERIODOS_ALZA.map((periodo) => (
                    <option key={periodo} value={periodo}>
                      {periodo}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Monto arriendo
                <input
                  type="number"
                  min={0}
                  value={arriendoForm.montoArriendo}
                  onChange={(e) => setArriendoForm({ ...arriendoForm, montoArriendo: e.target.value })}
                />
              </label>
              {editingArriendoId && (
                <>
                  <label>
                    Km recepción
                    <input
                      type="number"
                      min={0}
                      value={arriendoForm.kilometrajeRecepcion}
                      onChange={(e) =>
                        setArriendoForm({ ...arriendoForm, kilometrajeRecepcion: e.target.value })
                      }
                    />
                  </label>
                  <label>
                    Estado
                    <select
                      value={arriendoForm.estado}
                      onChange={(e) =>
                        setArriendoForm({ ...arriendoForm, estado: e.target.value as EstadoArriendo })
                      }
                    >
                      {ESTADOS_ARRIENDO.map((estado) => (
                        <option key={estado} value={estado}>
                          {estado}
                        </option>
                      ))}
                    </select>
                  </label>
                </>
              )}
            </div>

            <div className="table__actions">
              <button type="button" onClick={handleGuardarArriendo}>
                {editingArriendoId ? 'Guardar cambios' : 'Agregar'}
              </button>
              {editingArriendoId && (
                <button
                  type="button"
                  className="danger"
                  onClick={() => handleDeleteArriendo(editingArriendoId)}
                >
                  Eliminar
                </button>
              )}
            </div>
          </div>
        </Modal>
      )}

      {otrosArriendos.length > 0 && (
        <section>
          <div className="page-header">
            <h2>Historial de arrendatarios</h2>
          </div>
          <div className="proveedores-panel__grid">
            {otrosArriendos.map((a) => (
              <div key={a.id} className="proveedores-panel__row">
                <span className="proveedores-panel__tipo">{a.arrendatario.nombreCompleto}</span>
                <span>Monto: {formatMonto(a.montoArriendo)}/mes</span>
                <span>Entrega: {formatFecha(a.fechaEntrega)}</span>
                <span>
                  Estado: <span className={`badge badge--${a.estado.toLowerCase()}`}>{a.estado}</span>
                </span>
                <div className="proveedores-panel__row-actions">
                  <button
                    type="button"
                    className="icon-button icon-button--small"
                    title="Editar"
                    aria-label="Editar"
                    onClick={() => abrirEdicionArriendo(a)}
                  >
                    <IconEditar />
                  </button>
                  <button
                    type="button"
                    className="icon-button icon-button--small icon-button--danger"
                    title="Eliminar"
                    aria-label="Eliminar"
                    onClick={() => handleDeleteArriendo(a.id)}
                  >
                    <IconEliminar />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {arriendoActivo && (
        <section>
          <div className="page-header">
            <h2>Pagos de arriendo</h2>
            <button type="button" onClick={abrirCreacionPago}>
              + Registrar pago
            </button>
          </div>

          {pagosAuto.length > 0 && (
            <div className="stat-grid">
              <div className="stat-card stat-card--pagado">
                <span className="stat-card__label">Monto recaudado total</span>
                <span className="stat-card__value">{formatMonto(montoRecaudadoTotal)}</span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">Días de arriendo</span>
                <span className="stat-card__value">
                  {diasArriendoTotal.toLocaleString('es-CL')} /{' '}
                  {(diasArriendoTotal / 30).toFixed(1)} meses
                </span>
              </div>
              <div className="stat-card">
                <span className="stat-card__label">Último kilometraje registrado</span>
                <span className="stat-card__value">
                  {ultimoKilometrajeRegistrado != null
                    ? `${ultimoKilometrajeRegistrado.toLocaleString('es-CL')} km`
                    : '—'}
                </span>
              </div>
            </div>
          )}

          {pagosAuto.length === 0 && <p className="empty-state">Sin pagos registrados.</p>}

          {pagosAuto.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Fecha de pago</th>
                    <th>Periodo de pago</th>
                    <th>Cantidad de días</th>
                    <th>Kilometraje</th>
                    <th>Monto</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                    <th>Revisión</th>
                    <th>Acciones</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosAutoVisibles.map((pago) => {
                      const cantidadDias = pago.periodoHasta
                        ? Math.round(
                            (new Date(pago.periodoHasta).getTime() -
                              new Date(pago.fechaComprometida).getTime()) /
                              86400000,
                          ) + 1
                        : null;
                      const esGarantia = tipoPagoDePago(pago) === 'garantia';
                      return (
                        <tr key={pago.id} className={esGarantia ? 'table-row--garantia' : undefined}>
                          <td>{formatFecha(pago.periodo)}</td>
                          <td>
                            {esGarantia ? (
                              '—'
                            ) : (
                              <>
                                {formatFecha(pago.fechaComprometida)}
                                {pago.periodoHasta ? ` – ${formatFecha(pago.periodoHasta)}` : ''}
                              </>
                            )}
                          </td>
                          <td>{cantidadDias != null ? `${cantidadDias} días` : '—'}</td>
                          <td>
                            {pago.kilometraje != null
                              ? `${pago.kilometraje.toLocaleString('es-CL')} km`
                              : '—'}
                          </td>
                          <td>{formatMonto(pago.monto)}</td>
                          <td>
                            <span className={`badge badge--tipo-${tipoPagoDePago(pago)}`}>
                              {
                                { arriendo: 'Arriendo', abono: 'Abono', garantia: 'Garantía' }[
                                  tipoPagoDePago(pago)
                                ]
                              }
                            </span>
                          </td>
                          <td>
                            <span className={`badge badge--${pago.estado.toLowerCase()}`}>
                              {pago.estado}
                            </span>
                          </td>
                          <td>
                            {pago.aprobado !== null && (
                              <div>
                                <span
                                  className="icono-revision icono-revision--aprobado"
                                  title="Revisado"
                                >
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
                              </div>
                            )}
                          </td>
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
                                onClick={() => handleDeletePago(pago.id)}
                              >
                                <IconEliminar />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                </tbody>
              </table>
            </div>
          )}

          {pagosAutoOrdenados.length > PAGOS_AUTO_LIMITE_VISIBLE && (
            <button
              type="button"
              className="link-button link-button--mostrar-mas"
              onClick={() => setMostrarTodoPagosAuto((v) => !v)}
            >
              {mostrarTodoPagosAuto ? 'Mostrar menos' : 'Mostrar más'}
            </button>
          )}
        </section>
      )}

      {showPagoForm && (
        <Modal
          titulo={editingPagoId ? 'Editar pago' : 'Registrar pago de arriendo'}
          onClose={cancelarEdicionPago}
        >
          <div className="inline-form">
            {pagoError && <p className="auth-card__error">{pagoError}</p>}
            <div className="inline-form__grid">
              <label>
                Fecha de pago
                <DateInput
                  value={pagoForm.periodo}
                  onChange={(value) => setPagoForm({ ...pagoForm, periodo: value })}
                  required
                />
              </label>
              {pagoForm.tipoPago !== 'garantia' && (
                <>
                  <label>
                    Periodo desde
                    <DateInput
                      value={pagoForm.fechaComprometida}
                      onChange={(value) => setPagoForm({ ...pagoForm, fechaComprometida: value })}
                      required
                    />
                  </label>
                  <label>
                    Periodo hasta
                    <DateInput
                      value={pagoForm.periodoHasta}
                      onChange={(value) => setPagoForm({ ...pagoForm, periodoHasta: value })}
                      required
                    />
                  </label>
                </>
              )}
              <label>
                Kilometraje (opcional)
                <input
                  type="number"
                  min={0}
                  value={pagoForm.kilometraje}
                  onChange={(e) => setPagoForm({ ...pagoForm, kilometraje: e.target.value })}
                />
              </label>
              <label>
                Tipo de pago
                <select
                  value={pagoForm.tipoPago}
                  onChange={(e) =>
                    setPagoForm({
                      ...pagoForm,
                      tipoPago: e.target.value as 'arriendo' | 'abono' | 'garantia',
                    })
                  }
                >
                  <option value="arriendo">Arriendo</option>
                  <option value="abono">Abono</option>
                  <option value="garantia">Garantía</option>
                </select>
              </label>
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
              {editingPagoId && (
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

            <button type="button" onClick={handleGuardarPago} disabled={savingPago}>
              {savingPago ? 'Guardando…' : editingPagoId ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
        </Modal>
      )}

      <section>
        <div className="page-header">
          <h2>Mantenciones</h2>
          <button type="button" onClick={abrirCreacionMantencion}>
            + Registrar mantención
          </button>
        </div>

        {mantenciones.length === 0 && <p className="empty-state">Sin mantenciones registradas.</p>}

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
                  <th>Responsable</th>
                  <th>Estado</th>
                  <th>Revisión</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {mantencionesVisibles.map((m) => (
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
                      {m.quienPago ? (
                        <span className={`badge badge--${m.quienPago.toLowerCase()}`}>
                          {formatEnumLabel(m.quienPago)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td>
                      <span className={`badge badge--${m.estadoPago.toLowerCase()}`}>
                        {m.estadoPago}
                      </span>
                    </td>
                    <td>
                      {m.aprobado !== null && (
                        <div>
                          <span className="icono-revision icono-revision--aprobado" title="Revisado">
                            <IconCheck />
                          </span>
                          {m.aprobado === false && m.motivoRechazo && (
                            <p className="table__note">{m.motivoRechazo}</p>
                          )}
                        </div>
                      )}
                      {m.aprobado === null && (
                        <div className="table__actions">
                          <span className="icono-revision icono-revision--pendiente" title="Pendiente">
                            <IconReloj />
                          </span>
                          <button type="button" onClick={() => handleAprobarMantencion(m.id)}>
                            Aprobar
                          </button>
                          <button
                            type="button"
                            className="danger"
                            onClick={() => handleRechazarMantencion(m.id)}
                          >
                            Rechazar
                          </button>
                        </div>
                      )}
                    </td>
                    <td>
                      <div className="table__actions">
                        <button
                          type="button"
                          className="icon-button"
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => abrirEdicionMantencion(m)}
                        >
                          <IconEditar />
                        </button>
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => handleDeleteMantencion(m.id)}
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
        )}

        {mantenciones.length > MANTENCION_LIMITE_VISIBLE && (
          <button
            type="button"
            className="link-button link-button--mostrar-mas"
            onClick={() => setMostrarTodoMantenciones((v) => !v)}
          >
            {mostrarTodoMantenciones ? 'Mostrar menos' : 'Mostrar más'}
          </button>
        )}
      </section>

      <section>
        <div className="page-header">
          <h2>Tag</h2>
          <div className="page-header__actions">
            <button type="button" onClick={abrirAbono}>
              + Registrar abono
            </button>
            <button type="button" onClick={abrirCreacionTag}>
              + Registrar boleta
            </button>
          </div>
        </div>

        {pagosTag.length > 0 && (
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-card__label">Monto facturado</span>
              <span className="stat-card__value">{formatMonto(montoFacturado)}</span>
            </div>
            <div className="stat-card stat-card--pagado">
              <span className="stat-card__label">Monto pagado</span>
              <span className="stat-card__value">{formatMonto(montoPagadoTag)}</span>
            </div>
            <div className="stat-card stat-card--pendiente">
              <span className="stat-card__label">Saldo pendiente</span>
              <span className="stat-card__value">
                {formatMonto(montoFacturado - montoPagadoTag)}
              </span>
            </div>
          </div>
        )}

        {pagosTag.length === 0 && <p className="empty-state">Sin pagos de TAG registrados.</p>}

        {pagosTag.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Autopista</th>
                  <th>N° de boleta</th>
                  <th>Fecha</th>
                  <th>Monto</th>
                  <th>Pendiente de pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagosTagVisibles.map((pago) => (
                    <tr key={pago.id} className={pago.esAbono ? 'table-row--abono' : undefined}>
                      <td>{pago.esAbono ? 'Abono' : (pago.autopista ?? '—')}</td>
                      <td>{pago.numeroBoleta ?? '—'}</td>
                      <td>{formatFecha(pago.fechaPago)}</td>
                      <td>{pago.esAbono ? `-${formatMonto(pago.monto)}` : formatMonto(pago.monto)}</td>
                      <td>
                        {pago.esAbono
                          ? formatMonto(pendienteAlMomentoDelAbono.get(pago.id) ?? 0)
                          : ''}
                      </td>
                      <td>
                        <div className="table__actions">
                          <button
                            type="button"
                            className="icon-button"
                            title="Editar"
                            aria-label="Editar"
                            onClick={() =>
                              pago.esAbono ? abrirEdicionAbono(pago) : abrirEdicionTag(pago)
                            }
                          >
                            <IconEditar />
                          </button>
                          <button
                            type="button"
                            className="icon-button icon-button--danger"
                            title="Eliminar"
                            aria-label="Eliminar"
                            onClick={() => handleDeleteTag(pago.id)}
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
        )}

        {pagosTagOrdenados.length > TAG_LIMITE_VISIBLE && (
          <button
            type="button"
            className="link-button link-button--mostrar-mas"
            onClick={() => setMostrarTodoTag((v) => !v)}
          >
            {mostrarTodoTag ? 'Mostrar menos' : 'Mostrar más'}
          </button>
        )}
      </section>

      <section>
        <div className="page-header">
          <h2>Multas</h2>
          <button type="button" onClick={abrirCreacionMulta}>
            + Registrar multa
          </button>
        </div>

        {pagosMulta.length === 0 && <p className="empty-state">Sin multas registradas.</p>}

        {pagosMulta.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>N° de parte</th>
                  <th>Fecha de la multa</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Fecha de pago</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {[...pagosMulta]
                  .sort((a, b) => b.fechaPago.localeCompare(a.fechaPago))
                  .map((pago) => (
                    <tr key={pago.id}>
                      <td>{pago.numeroBoleta ?? '—'}</td>
                      <td>{formatFecha(pago.fechaPago)}</td>
                      <td>{formatMonto(pago.monto)}</td>
                      <td>
                        <span className={`badge badge--${pago.estado.toLowerCase()}`}>
                          {pago.estado}
                        </span>
                      </td>
                      <td>{pago.fechaPagoReal ? formatFecha(pago.fechaPagoReal) : '—'}</td>
                      <td>
                        <div className="table__actions">
                          <button
                            type="button"
                            className="icon-button"
                            title="Editar"
                            aria-label="Editar"
                            onClick={() => abrirEdicionMulta(pago)}
                          >
                            <IconEditar />
                          </button>
                          <button
                            type="button"
                            className="icon-button icon-button--danger"
                            title="Eliminar"
                            aria-label="Eliminar"
                            onClick={() => handleDeleteMulta(pago.id)}
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
        )}
      </section>

      {showMultaForm && (
        <Modal
          titulo={editingMultaId ? 'Editar multa' : 'Registrar multa'}
          onClose={cancelarEdicionMulta}
        >
          <div className="inline-form">
            {multaError && <p className="auth-card__error">{multaError}</p>}
            <div className="inline-form__grid">
              <label>
                N° de parte
                <input
                  value={multaForm.numeroBoleta}
                  onChange={(e) => setMultaForm({ ...multaForm, numeroBoleta: e.target.value })}
                />
              </label>
              <label>
                Fecha de la multa
                <DateInput
                  value={multaForm.fechaPago}
                  onChange={(value) => setMultaForm({ ...multaForm, fechaPago: value })}
                  required
                />
              </label>
              <label>
                Monto
                <input
                  type="number"
                  min={0}
                  required
                  value={multaForm.monto}
                  onChange={(e) => setMultaForm({ ...multaForm, monto: e.target.value })}
                />
              </label>
              <label>
                Estado
                <select
                  value={multaForm.estado}
                  onChange={(e) =>
                    setMultaForm({ ...multaForm, estado: e.target.value as EstadoPago })
                  }
                >
                  {ESTADOS_PAGO.map((estado) => (
                    <option key={estado} value={estado}>
                      {estado}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Fecha de pago (si ya se pagó)
                <DateInput
                  value={multaForm.fechaPagoReal}
                  onChange={(value) => setMultaForm({ ...multaForm, fechaPagoReal: value })}
                />
              </label>
            </div>

            <button type="button" onClick={handleGuardarMulta} disabled={savingMulta}>
              {savingMulta ? 'Guardando…' : editingMultaId ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
        </Modal>
      )}

      {showAbonoForm && (
        <Modal titulo={editingAbonoId ? 'Editar abono' : 'Registrar abono'} onClose={cerrarAbono}>
          <div className="inline-form">
            {abonoError && <p className="auth-card__error">{abonoError}</p>}

            <label>
              Fecha del abono
              <DateInput value={fechaAbono} onChange={setFechaAbono} required />
            </label>

            <label>
              Monto a abonar
              <input
                type="number"
                min="0"
                step="1"
                value={montoAbono}
                onChange={(e) => setMontoAbono(e.target.value)}
              />
            </label>

            <button type="button" onClick={handleRegistrarAbono} disabled={savingAbono}>
              {savingAbono ? 'Guardando…' : editingAbonoId ? 'Guardar cambios' : 'Registrar abono'}
            </button>
          </div>
        </Modal>
      )}

      {showTagForm && (
        <Modal titulo={editingTagId ? 'Editar pago de TAG' : 'Registrar pago de TAG'} onClose={cancelarEdicionTag}>
          <div className="inline-form">
            {tagError && <p className="auth-card__error">{tagError}</p>}
            <div className="inline-form__grid">
              <label>
                Autopista
                <select
                  required
                  value={tagForm.autopista}
                  onChange={(e) => setTagForm({ ...tagForm, autopista: e.target.value })}
                >
                  <option value="">Elige una autopista…</option>
                  {AUTOPISTAS_TAG.map((autopista) => (
                    <option key={autopista} value={autopista}>
                      {autopista}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                N° de boleta
                <input
                  required
                  value={tagForm.numeroBoleta}
                  onChange={(e) => setTagForm({ ...tagForm, numeroBoleta: e.target.value })}
                />
              </label>
              <label>
                Fecha
                <DateInput
                  value={tagForm.fechaPago}
                  onChange={(value) => setTagForm({ ...tagForm, fechaPago: value })}
                  required
                />
              </label>
              <label>
                Monto
                <input
                  type="number"
                  min={0}
                  required
                  value={tagForm.monto}
                  onChange={(e) => setTagForm({ ...tagForm, monto: e.target.value })}
                />
              </label>
            </div>

            <button type="button" onClick={handleGuardarTag} disabled={savingTag}>
              {savingTag ? 'Guardando…' : editingTagId ? 'Guardar cambios' : 'Registrar'}
            </button>
          </div>
        </Modal>
      )}

      {showMantencionForm && (
        <Modal
          titulo={editingMantencionId ? 'Editar mantención' : 'Registrar mantención'}
          onClose={cancelarEdicionMantencion}
        >
          <div className="inline-form">
            {mantencionError && <p className="auth-card__error">{mantencionError}</p>}

            <div className="tipo-mantencion-checks">
              {configuraciones.map((c) => (
                <label key={c.id} className="checkbox">
                  <input
                    type="checkbox"
                    checked={mantencionForm.configuracionIds.includes(c.id)}
                    onChange={() => toggleTipoMantencion(c.id)}
                  />
                  {c.tipo}
                </label>
              ))}
              <button
                type="button"
                className="link-button"
                onClick={() => setShowNuevaConfig((v) => !v)}
              >
                {showNuevaConfig ? 'Cancelar' : '+ Nuevo tipo'}
              </button>
            </div>

            {showNuevaConfig && (
              <div className="proveedores-panel__add">
                <input
                  placeholder="Nombre (ej. Cambio de aceite)"
                  value={nuevaConfigForm.tipo}
                  onChange={(e) => setNuevaConfigForm({ ...nuevaConfigForm, tipo: e.target.value })}
                />
                <input
                  type="number"
                  placeholder="Cada cuántos km"
                  min={1}
                  value={nuevaConfigForm.cadaKm}
                  onChange={(e) => setNuevaConfigForm({ ...nuevaConfigForm, cadaKm: e.target.value })}
                />
                <button type="button" onClick={handleCrearConfiguracion}>
                  Crear tipo
                </button>
              </div>
            )}

            <div className="inline-form__grid">
              <input
                type="number"
                placeholder="Km actual"
                min={0}
                value={mantencionForm.kilometrajeActual}
                onChange={(e) =>
                  setMantencionForm({ ...mantencionForm, kilometrajeActual: e.target.value })
                }
              />
              <input
                type="number"
                placeholder="Próxima km (opcional)"
                min={0}
                value={mantencionForm.kilometrajeProxima}
                onChange={(e) =>
                  setMantencionForm({ ...mantencionForm, kilometrajeProxima: e.target.value })
                }
              />
              <DateInput
                value={mantencionForm.fechaMantencion}
                onChange={(value) => setMantencionForm({ ...mantencionForm, fechaMantencion: value })}
              />
              <input
                type="number"
                placeholder="Costo (opcional)"
                min={0}
                value={mantencionForm.costo}
                onChange={(e) => setMantencionForm({ ...mantencionForm, costo: e.target.value })}
              />
              <select
                value={mantencionForm.quienPago}
                onChange={(e) =>
                  setMantencionForm({
                    ...mantencionForm,
                    quienPago: e.target.value as QuienPago | '',
                  })
                }
              >
                <option value="">¿Quién paga?…</option>
                {QUIENES_PAGO.map((quien) => (
                  <option key={quien} value={quien}>
                    {formatEnumLabel(quien)}
                  </option>
                ))}
              </select>
              <select
                value={mantencionForm.estadoPago}
                onChange={(e) =>
                  setMantencionForm({
                    ...mantencionForm,
                    estadoPago: e.target.value as EstadoPago,
                  })
                }
              >
                {ESTADOS_PAGO.map((estado) => (
                  <option key={estado} value={estado}>
                    {estado}
                  </option>
                ))}
              </select>
            </div>

            <button type="button" onClick={handleGuardarMantencion}>
              {editingMantencionId ? 'Guardar cambios' : 'Agregar'}
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}
