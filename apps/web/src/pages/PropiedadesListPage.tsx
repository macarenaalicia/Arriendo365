import { useEffect, useMemo, useState } from 'react';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import { EMPRESAS_POR_TIPO_PROVEEDOR } from '../api/types';
import type { Documento, EstadoProveedor, Foto, Propiedad, Proveedor, TipoProveedor } from '../api/types';
import { formatEnumLabel, formatFecha, sufijoUnidadPropiedad } from '../lib/format';
import { eliminarFoto, listarFotos, subirFoto } from '../lib/fotos';
import { eliminarDocumento, listarDocumentos, subirDocumento } from '../lib/documentos';
import { REGIONES, REGIONES_COMUNAS } from '../lib/chile';
import { Modal } from '../components/Modal';
import { useConfirmarEliminar } from '../lib/useConfirmarEliminar';
import { IconDuplicar, IconEditar, IconEliminar } from '../components/icons';
import { OnboardingTour } from '../components/OnboardingTour';
import { useOnboardingTour } from '../lib/useOnboardingTour';

const PROPIEDADES_TOUR_STEPS = [
  {
    target: 'propiedades-nueva',
    titulo: 'Agrega tus propiedades',
    texto: 'Aquí puedes registrar una nueva propiedad con su dirección, tipo y datos básicos.',
  },
  {
    target: 'propiedades-tabla',
    titulo: 'Tu listado de propiedades',
    texto:
      'Cada fila es una propiedad. Puedes editar celdas con un clic, o usar los íconos de la derecha para editar, duplicar o eliminar.',
  },
  {
    target: 'propiedades-publico',
    titulo: 'Página pública',
    texto: 'Este enlace muestra a los interesados las propiedades disponibles para arrendar.',
  },
];

const TIPOS = ['CASA', 'DEPARTAMENTO', 'HABITACION', 'LOFT', 'VECINDAD', 'TERRENO'] as const;
// Habitación/loft siempre necesitan una madre (comparten sus proveedores).
const TIPOS_PIEZA: (typeof TIPOS)[number][] = ['HABITACION', 'LOFT'];
// Casa/depto pueden pertenecer opcionalmente a una vecindad, manteniendo
// sus propias cuentas de proveedores.
const TIPOS_MADRE_OPCIONAL: (typeof TIPOS)[number][] = ['CASA', 'DEPARTAMENTO'];
const ESTADOS_PROPIEDAD = ['DISPONIBLE', 'ARRENDADA', 'EN_MANTENCION', 'USUFRUCTO'] as const;
const MAX_FOTOS_PROPIEDAD = 10;

type CampoOrdenable =
  | 'rol'
  | 'direccion'
  | 'ubicacion'
  | 'tipo'
  | 'nHabitaciones'
  | 'nBanos'
  | 'mt2Totales'
  | 'mt2Construidos'
  | 'estado';

type CampoCelda = 'rol' | 'nHabitaciones' | 'nBanos' | 'mt2Totales' | 'mt2Construidos';

const FORM_INICIAL = {
  rol: '',
  calle: '',
  numero: '',
  numeroDepartamento: '',
  numeroHabitacion: '',
  propiedadPadreId: '',
  sector: '',
  ciudad: '',
  region: '',
  tipo: 'CASA' as (typeof TIPOS)[number],
  nHabitaciones: '',
  nBanos: '',
  mt2Totales: '',
  mt2Construidos: '',
  bodega: false,
  estacionamiento: false,
  pagaContribuciones: false,
  descripcion: '',
  precioArriendoEsperado: '',
  fojasInscripcion: '',
  numeroInscripcion: '',
  anioInscripcion: '',
  aguaEmpresa: EMPRESAS_POR_TIPO_PROVEEDOR.AGUA[0],
  aguaCliente: '',
  luzEmpresa: EMPRESAS_POR_TIPO_PROVEEDOR.LUZ[0],
  luzCliente: '',
  gasEmpresa: EMPRESAS_POR_TIPO_PROVEEDOR.GAS[0],
  gasCliente: '',
};

const PROVEEDOR_LABELS: Record<TipoProveedor, string> = {
  AGUA: 'Agua',
  LUZ: 'Luz',
  GAS: 'Gas',
};

const PROVEEDOR_FORM_INICIAL = {
  tipo: 'AGUA' as TipoProveedor,
  empresa: EMPRESAS_POR_TIPO_PROVEEDOR.AGUA[0],
  nCliente: '',
  estado: 'ACTIVO' as EstadoProveedor,
};

const DOCUMENTO_TIPOS_PROPIEDAD = [
  'Escritura',
  'Certificado de dominio vigente',
  'Certificado de avalúo (SII)',
  'Comprobante de contribuciones',
  'Otro',
];

const DOCUMENTO_FORM_INICIAL = {
  tipo: '',
  tipoOtro: '',
  fechaEmision: '',
  fechaVencimiento: '',
};

interface DocumentoPendiente {
  archivo: File;
  tipo: string;
  fechaEmision: string;
  fechaVencimiento: string;
}

export function PropiedadesListPage() {
  const { organizacionId } = useAuth();
  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const tour = useOnboardingTour('propiedades');
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [proveedores, setProveedores] = useState<Proveedor[]>([]);
  const [proveedorForm, setProveedorForm] = useState(PROVEEDOR_FORM_INICIAL);
  const [editingProveedorId, setEditingProveedorId] = useState<string | null>(null);

  const [fotos, setFotos] = useState<Foto[]>([]);
  const [fotoDescripcion, setFotoDescripcion] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const [arrastrandoFoto, setArrastrandoFoto] = useState(false);
  const [fotosPendientes, setFotosPendientes] = useState<File[]>([]);

  const [documentos, setDocumentos] = useState<Documento[]>([]);
  const [documentoForm, setDocumentoForm] = useState(DOCUMENTO_FORM_INICIAL);
  const [subiendoDocumento, setSubiendoDocumento] = useState(false);
  const [documentoError, setDocumentoError] = useState<string | null>(null);
  const [arrastrandoDocumento, setArrastrandoDocumento] = useState(false);
  const [documentosPendientes, setDocumentosPendientes] = useState<DocumentoPendiente[]>([]);

  const [sortField, setSortField] = useState<CampoOrdenable | null>('direccion');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('asc');

  const [editingCell, setEditingCell] = useState<{ id: string; campo: CampoCelda } | null>(null);
  const [cellValue, setCellValue] = useState('');

  const toggleSort = (campo: CampoOrdenable) => {
    if (sortField === campo) {
      setSortDir((dir) => (dir === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortField(campo);
      setSortDir('asc');
    }
  };

  const valorOrdenable = (propiedad: Propiedad, campo: CampoOrdenable): string | number => {
    switch (campo) {
      case 'rol':
        return propiedad.rol;
      case 'direccion':
        return `${propiedad.calle} ${propiedad.numero}`;
      case 'ubicacion':
        return `${propiedad.sector ?? ''} ${propiedad.ciudad}`;
      case 'tipo':
        return propiedad.tipo;
      case 'nHabitaciones':
        return propiedad.nHabitaciones;
      case 'nBanos':
        return propiedad.nBanos;
      case 'mt2Totales':
        return Number(propiedad.mt2Totales);
      case 'mt2Construidos':
        return Number(propiedad.mt2Construidos);
      case 'estado':
        return propiedad.estado;
    }
  };

  // Las piezas (habitación/loft) siempre se muestran justo debajo de su
  // propiedad madre, nunca sueltas mezcladas con el resto — el orden de
  // columna solo reordena las propiedades madre/independientes.
  const propiedadesAgrupadas = useMemo(() => {
    const comparar = (a: Propiedad, b: Propiedad) => {
      if (!sortField) return 0;
      const va = valorOrdenable(a, sortField);
      const vb = valorOrdenable(b, sortField);
      const cmp =
        typeof va === 'number' && typeof vb === 'number'
          ? va - vb
          : String(va).localeCompare(String(vb), 'es');
      return sortDir === 'asc' ? cmp : -cmp;
    };

    const principales = propiedades.filter((p) => !p.propiedadPadreId).sort(comparar);
    const resultado: Propiedad[] = [];
    principales.forEach((padre) => {
      resultado.push(padre);
      const piezas = propiedades
        .filter((p) => p.propiedadPadreId === padre.id)
        .sort((a, b) =>
          (a.numeroHabitacion ?? '').localeCompare(b.numeroHabitacion ?? '', 'es', { numeric: true }),
        );
      resultado.push(...piezas);
    });
    return resultado;
  }, [propiedades, sortField, sortDir]);

  const guardarCampo = async (id: string, campo: string, valor: unknown) => {
    await api.patch(`/propiedades/${id}`, { [campo]: valor });
    cargar();
  };

  const startEditCell = (propiedad: Propiedad, campo: CampoCelda) => {
    setEditingCell({ id: propiedad.id, campo });
    setCellValue(String(propiedad[campo]));
  };

  const commitCellEdit = async (propiedad: Propiedad) => {
    if (!editingCell || editingCell.id !== propiedad.id) return;
    const campo = editingCell.campo;
    setEditingCell(null);

    const valorActual = String(propiedad[campo]);
    const raw = cellValue.trim();
    if (raw === '' || raw === valorActual) return;

    const valor = campo === 'rol' ? raw : Number(raw);
    if (campo !== 'rol' && Number.isNaN(valor as number)) return;

    await guardarCampo(propiedad.id, campo, valor);
  };

  const cargar = () => {
    setLoading(true);
    setLoadError(null);
    api
      .get<Propiedad[]>('/propiedades')
      .then(setPropiedades)
      .catch(() => setLoadError('No se pudo cargar la información de las propiedades'))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);

  const cerrarForm = () => {
    setShowForm(false);
    setEditingId(null);
    setForm(FORM_INICIAL);
    setError(null);
  };

  const abrirCreacion = () => {
    setForm(FORM_INICIAL);
    setEditingId(null);
    setFotos([]);
    setFotoDescripcion('');
    setFotoError(null);
    setFotosPendientes([]);
    setDocumentos([]);
    setDocumentoForm(DOCUMENTO_FORM_INICIAL);
    setDocumentoError(null);
    setDocumentosPendientes([]);
    setProveedores([]);
    setEditingProveedorId(null);
    setProveedorForm(PROVEEDOR_FORM_INICIAL);
    setShowForm(true);
  };

  const abrirEdicion = async (propiedad: Propiedad) => {
    setForm({
      ...FORM_INICIAL,
      rol: propiedad.rol,
      calle: propiedad.calle,
      numero: propiedad.numero,
      numeroDepartamento: propiedad.numeroDepartamento ?? '',
      numeroHabitacion: propiedad.numeroHabitacion ?? '',
      propiedadPadreId: propiedad.propiedadPadreId ?? '',
      sector: propiedad.sector ?? '',
      ciudad: propiedad.ciudad,
      region: propiedad.region,
      tipo: propiedad.tipo,
      nHabitaciones: String(propiedad.nHabitaciones),
      nBanos: String(propiedad.nBanos),
      mt2Totales: propiedad.mt2Totales,
      mt2Construidos: propiedad.mt2Construidos,
      bodega: propiedad.bodega,
      estacionamiento: propiedad.estacionamiento,
      pagaContribuciones: propiedad.pagaContribuciones,
      descripcion: propiedad.descripcion ?? '',
      precioArriendoEsperado: propiedad.precioArriendoEsperado ?? '',
      fojasInscripcion: propiedad.fojasInscripcion ?? '',
      numeroInscripcion: propiedad.numeroInscripcion ?? '',
      anioInscripcion: propiedad.anioInscripcion ? String(propiedad.anioInscripcion) : '',
    });
    setEditingId(propiedad.id);
    setFotoDescripcion('');
    setFotoError(null);
    setFotosPendientes([]);
    setDocumentoForm(DOCUMENTO_FORM_INICIAL);
    setDocumentoError(null);
    setDocumentosPendientes([]);
    setEditingProveedorId(null);
    setProveedorForm(PROVEEDOR_FORM_INICIAL);
    setShowForm(true);
    const [listaFotos, listaProveedores, listaDocumentos] = await Promise.all([
      listarFotos('propiedad', propiedad.id),
      api.get<Proveedor[]>(`/propiedades/${propiedad.id}/proveedores`),
      listarDocumentos('propiedad', propiedad.id),
    ]);
    setFotos(listaFotos);
    setProveedores(listaProveedores);
    setDocumentos(listaDocumentos);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const esPieza = TIPOS_PIEZA.includes(form.tipo);
    const esMadreOpcional = TIPOS_MADRE_OPCIONAL.includes(form.tipo);
    if (esPieza && !form.propiedadPadreId) {
      setError('Elige a qué propiedad pertenece esta habitación o loft.');
      return;
    }

    setSaving(true);
    try {
      const payload = {
        rol: form.rol,
        calle: form.calle,
        numero: form.numero,
        numeroDepartamento:
          form.tipo === 'DEPARTAMENTO' && form.numeroDepartamento ? form.numeroDepartamento : undefined,
        numeroHabitacion:
          (esPieza || (esMadreOpcional && form.propiedadPadreId)) && form.numeroHabitacion
            ? form.numeroHabitacion
            : undefined,
        propiedadPadreId: esPieza
          ? form.propiedadPadreId
          : esMadreOpcional && form.propiedadPadreId
            ? form.propiedadPadreId
            : null,
        sector: form.sector || undefined,
        ciudad: form.ciudad,
        region: form.region,
        tipo: form.tipo,
        nHabitaciones: Number(form.nHabitaciones),
        nBanos: Number(form.nBanos),
        mt2Totales: Number(form.mt2Totales),
        mt2Construidos: Number(form.mt2Construidos),
        bodega: form.bodega,
        estacionamiento: form.estacionamiento,
        pagaContribuciones: form.pagaContribuciones,
        descripcion: form.descripcion || undefined,
        precioArriendoEsperado: form.precioArriendoEsperado
          ? Number(form.precioArriendoEsperado)
          : undefined,
        fojasInscripcion: form.fojasInscripcion || undefined,
        numeroInscripcion: form.numeroInscripcion || undefined,
        anioInscripcion: form.anioInscripcion ? Number(form.anioInscripcion) : undefined,
      };

      if (editingId) {
        await api.patch(`/propiedades/${editingId}`, payload);
      } else {
        const creada = await api.post<Propiedad>('/propiedades', payload);

        if (!esPieza) {
          const candidatos: Array<{ tipo: TipoProveedor; empresa: string; nCliente: string }> = [
            { tipo: 'AGUA', empresa: form.aguaEmpresa, nCliente: form.aguaCliente },
            { tipo: 'LUZ', empresa: form.luzEmpresa, nCliente: form.luzCliente },
            { tipo: 'GAS', empresa: form.gasEmpresa, nCliente: form.gasCliente },
          ];
          const proveedoresIniciales = candidatos.filter((p) => p.nCliente.trim() !== '');

          for (const proveedor of proveedoresIniciales) {
            await api.post(`/propiedades/${creada.id}/proveedores`, proveedor);
          }
        }

        for (const archivo of fotosPendientes) {
          await subirFoto(archivo, 'propiedad', creada.id);
        }

        for (const doc of documentosPendientes) {
          await subirDocumento(
            doc.archivo,
            doc.tipo,
            'propiedad',
            creada.id,
            doc.fechaEmision || undefined,
            doc.fechaVencimiento || undefined,
          );
        }
      }

      cerrarForm();
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la propiedad');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/propiedades/${id}`);
    cargar();
  };
  const eliminarPropiedad = useConfirmarEliminar<string>(handleDelete);

  const handleDuplicar = async (id: string) => {
    await api.post(`/propiedades/${id}/duplicar`);
    cargar();
  };

  const subirArchivoFoto = async (archivo: File) => {
    if (!editingId) return;

    setFotoError(null);
    setSubiendoFoto(true);
    try {
      await subirFoto(archivo, 'propiedad', editingId, fotoDescripcion || undefined);
      setFotoDescripcion('');
      const lista = await listarFotos('propiedad', editingId);
      setFotos(lista);
    } catch (err) {
      setFotoError(err instanceof ApiError ? err.message : 'No se pudo subir la foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleSubirFoto = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (archivo) subirArchivoFoto(archivo);
  };

  const handleDropFoto = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastrandoFoto(false);
    const archivo = event.dataTransfer.files?.[0];
    if (archivo) subirArchivoFoto(archivo);
  };

  const handleEliminarFoto = async (fotoId: string) => {
    await eliminarFoto(fotoId);
    setFotos((prev) => prev.filter((f) => f.id !== fotoId));
  };
  const eliminarFotoConfirmar = useConfirmarEliminar<string>(handleEliminarFoto);

  const agregarFotosPendientes = (event: React.ChangeEvent<HTMLInputElement>) => {
    const nuevos = Array.from(event.target.files ?? []).filter((archivo) =>
      archivo.type.startsWith('image/'),
    );
    event.target.value = '';
    if (nuevos.length === 0) return;
    setFotosPendientes((prev) => [...prev, ...nuevos].slice(0, MAX_FOTOS_PROPIEDAD));
  };

  const quitarFotoPendiente = (index: number) => {
    setFotosPendientes((prev) => prev.filter((_, i) => i !== index));
  };

  const subirArchivoDocumento = async (archivo: File) => {
    if (!editingId) return;

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
        'propiedad',
        editingId,
        documentoForm.fechaEmision || undefined,
        documentoForm.fechaVencimiento || undefined,
      );
      setDocumentoForm(DOCUMENTO_FORM_INICIAL);
      const lista = await listarDocumentos('propiedad', editingId);
      setDocumentos(lista);
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

  const agregarDocumentoPendiente = (event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (!archivo) return;

    const tipoFinal = documentoForm.tipo === 'Otro' ? documentoForm.tipoOtro.trim() : documentoForm.tipo;
    if (!tipoFinal) {
      setDocumentoError('Elige el tipo de documento antes de adjuntar el archivo.');
      return;
    }

    setDocumentoError(null);
    setDocumentosPendientes((prev) => [
      ...prev,
      {
        archivo,
        tipo: tipoFinal,
        fechaEmision: documentoForm.fechaEmision,
        fechaVencimiento: documentoForm.fechaVencimiento,
      },
    ]);
    setDocumentoForm(DOCUMENTO_FORM_INICIAL);
  };

  const quitarDocumentoPendiente = (index: number) => {
    setDocumentosPendientes((prev) => prev.filter((_, i) => i !== index));
  };

  const abrirEdicionProveedor = (proveedor: Proveedor) => {
    setEditingProveedorId(proveedor.id);
    setProveedorForm({
      tipo: proveedor.tipo,
      empresa: proveedor.empresa,
      nCliente: proveedor.nCliente,
      estado: proveedor.estado,
    });
  };

  const cancelarEdicionProveedor = () => {
    setEditingProveedorId(null);
    setProveedorForm(PROVEEDOR_FORM_INICIAL);
  };

  const handleGuardarProveedor = async () => {
    if (!editingId || !proveedorForm.nCliente.trim()) return;

    if (editingProveedorId) {
      await api.patch(`/propiedades/${editingId}/proveedores/${editingProveedorId}`, proveedorForm);
    } else {
      await api.post(`/propiedades/${editingId}/proveedores`, proveedorForm);
    }

    setEditingProveedorId(null);
    setProveedorForm(PROVEEDOR_FORM_INICIAL);
    const lista = await api.get<Proveedor[]>(`/propiedades/${editingId}/proveedores`);
    setProveedores(lista);
  };

  const handleDeleteProveedor = async (proveedorId: string) => {
    if (!editingId) return;
    await api.delete(`/propiedades/${editingId}/proveedores/${proveedorId}`);
    if (editingProveedorId === proveedorId) cancelarEdicionProveedor();
    setProveedores((prev) => prev.filter((p) => p.id !== proveedorId));
  };
  const eliminarProveedorConfirmar = useConfirmarEliminar<string>(handleDeleteProveedor);

  // Candidatas a madre de una habitación/loft: casas o deptos de primer
  // nivel (nunca otra pieza, nunca una vecindad, ni la propiedad que se
  // está editando).
  const propiedadesPadreDisponibles = propiedades.filter(
    (p) =>
      !p.propiedadPadreId &&
      p.id !== editingId &&
      (p.tipo === 'CASA' || p.tipo === 'DEPARTAMENTO'),
  );
  // Candidatas a madre de una casa/depto: solo vecindades.
  const vecindadesDisponibles = propiedades.filter(
    (p) => !p.propiedadPadreId && p.id !== editingId && p.tipo === 'VECINDAD',
  );
  const esPiezaForm = TIPOS_PIEZA.includes(form.tipo);
  const esMadreOpcionalForm = TIPOS_MADRE_OPCIONAL.includes(form.tipo);
  const propiedadPadreForm = propiedades.find((p) => p.id === form.propiedadPadreId);

  return (
    <div>
      <div className="page-header">
        <h1>Propiedades</h1>
        <div className="page-header__actions">
          {organizacionId && (
            <a
              data-tour="propiedades-publico"
              className="back-link"
              href={`/publico/${organizacionId}/propiedades`}
              target="_blank"
              rel="noreferrer"
            >
              Ver página pública ↗
            </a>
          )}
          <button type="button" data-tour="propiedades-nueva" onClick={abrirCreacion}>
            + Nueva propiedad
          </button>
        </div>
      </div>

      {showForm && (
        <Modal titulo={editingId ? 'Editar propiedad' : 'Nueva propiedad'} onClose={cerrarForm}>
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="inline-form__grid">
            <label>
              Rol de avalúo
              <input
                required
                value={form.rol}
                onChange={(e) => setForm({ ...form, rol: e.target.value })}
              />
            </label>
            <label>
              Tipo
              <select
                value={form.tipo}
                onChange={(e) => setForm({ ...form, tipo: e.target.value as typeof form.tipo })}
              >
                {TIPOS.map((t) => (
                  <option key={t} value={t}>
                    {t}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Calle
              <input
                required
                value={form.calle}
                onChange={(e) => setForm({ ...form, calle: e.target.value })}
              />
            </label>
            <label>
              Número
              <input
                required
                value={form.numero}
                onChange={(e) => setForm({ ...form, numero: e.target.value })}
              />
            </label>
            {form.tipo === 'DEPARTAMENTO' && (
              <label>
                Número de departamento
                <input
                  value={form.numeroDepartamento}
                  onChange={(e) => setForm({ ...form, numeroDepartamento: e.target.value })}
                />
              </label>
            )}
            {TIPOS_PIEZA.includes(form.tipo) && (
              <>
                <label>
                  {form.tipo === 'LOFT' ? 'Loft' : 'Habitación'}
                  <input
                    placeholder="1, 2, 3… o A, B, C…"
                    value={form.numeroHabitacion}
                    onChange={(e) => setForm({ ...form, numeroHabitacion: e.target.value })}
                  />
                </label>
                <label>
                  Pertenece a
                  <select
                    required
                    value={form.propiedadPadreId}
                    onChange={(e) => {
                      const padre = propiedadesPadreDisponibles.find((p) => p.id === e.target.value);
                      setForm({
                        ...form,
                        propiedadPadreId: e.target.value,
                        calle: padre?.calle ?? form.calle,
                        numero: padre?.numero ?? form.numero,
                        sector: padre?.sector ?? form.sector,
                        ciudad: padre?.ciudad ?? form.ciudad,
                        region: padre?.region ?? form.region,
                      });
                    }}
                  >
                    <option value="">Elige la casa/depto…</option>
                    {propiedadesPadreDisponibles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.calle} {p.numero}
                        {sufijoUnidadPropiedad(p)}
                      </option>
                    ))}
                  </select>
                </label>
              </>
            )}
            {esMadreOpcionalForm && (
              <>
                <label>
                  Pertenece a una vecindad (opcional)
                  <select
                    value={form.propiedadPadreId}
                    onChange={(e) => {
                      const padre = vecindadesDisponibles.find((p) => p.id === e.target.value);
                      setForm({
                        ...form,
                        propiedadPadreId: e.target.value,
                        calle: padre?.calle ?? form.calle,
                        numero: padre?.numero ?? form.numero,
                        sector: padre?.sector ?? form.sector,
                        ciudad: padre?.ciudad ?? form.ciudad,
                        region: padre?.region ?? form.region,
                      });
                    }}
                  >
                    <option value="">Es independiente (no pertenece a ninguna)</option>
                    {vecindadesDisponibles.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.calle} {p.numero}
                      </option>
                    ))}
                  </select>
                </label>
                {form.tipo === 'CASA' && form.propiedadPadreId && (
                  <label>
                    Identificador de la casa
                    <input
                      placeholder="A, B, C… o 1, 2, 3…"
                      value={form.numeroHabitacion}
                      onChange={(e) => setForm({ ...form, numeroHabitacion: e.target.value })}
                    />
                  </label>
                )}
              </>
            )}
            <label>
              Sector
              <input
                value={form.sector}
                onChange={(e) => setForm({ ...form, sector: e.target.value })}
              />
            </label>
            <label>
              Región
              <select
                required
                value={form.region}
                onChange={(e) => setForm({ ...form, region: e.target.value, ciudad: '' })}
              >
                <option value="">Elige una región…</option>
                {REGIONES.map((region) => (
                  <option key={region} value={region}>
                    {region}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Ciudad / comuna
              <select
                required
                disabled={!form.region}
                value={form.ciudad}
                onChange={(e) => setForm({ ...form, ciudad: e.target.value })}
              >
                <option value="">{form.region ? 'Elige una comuna…' : 'Elige primero una región'}</option>
                {(REGIONES_COMUNAS[form.region] ?? []).map((comuna) => (
                  <option key={comuna} value={comuna}>
                    {comuna}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Habitaciones
              <input
                type="number"
                min={0}
                required
                value={form.nHabitaciones}
                onChange={(e) => setForm({ ...form, nHabitaciones: e.target.value })}
              />
            </label>
            <label>
              Baños
              <input
                type="number"
                min={0}
                required
                value={form.nBanos}
                onChange={(e) => setForm({ ...form, nBanos: e.target.value })}
              />
            </label>
            <label>
              M² totales
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={form.mt2Totales}
                onChange={(e) => setForm({ ...form, mt2Totales: e.target.value })}
              />
            </label>
            <label>
              M² construidos
              <input
                type="number"
                min={0}
                step="0.01"
                required
                value={form.mt2Construidos}
                onChange={(e) => setForm({ ...form, mt2Construidos: e.target.value })}
              />
            </label>
          </div>

          <div className="inline-form__checks">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.bodega}
                onChange={(e) => setForm({ ...form, bodega: e.target.checked })}
              />
              Bodega
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.estacionamiento}
                onChange={(e) => setForm({ ...form, estacionamiento: e.target.checked })}
              />
              Estacionamiento
            </label>
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.pagaContribuciones}
                onChange={(e) => setForm({ ...form, pagaContribuciones: e.target.checked })}
              />
              Paga contribuciones
            </label>
          </div>

          <label>
            Descripción
            <textarea
              value={form.descripcion}
              onChange={(e) => setForm({ ...form, descripcion: e.target.value })}
            />
          </label>

          <label>
            Precio de arriendo esperado (solo referencial, para la vista pública)
            <input
              type="number"
              min={0}
              placeholder="Ej. 450000"
              value={form.precioArriendoEsperado}
              onChange={(e) => setForm({ ...form, precioArriendoEsperado: e.target.value })}
            />
          </label>

          <fieldset className="inline-form__fieldset">
            <legend>Inscripción de dominio</legend>
            <div className="inline-form__grid">
              <label>
                Fojas
                <input
                  value={form.fojasInscripcion}
                  onChange={(e) => setForm({ ...form, fojasInscripcion: e.target.value })}
                />
              </label>
              <label>
                Número
                <input
                  value={form.numeroInscripcion}
                  onChange={(e) => setForm({ ...form, numeroInscripcion: e.target.value })}
                />
              </label>
              <label>
                Año
                <input
                  type="number"
                  min={1900}
                  max={2100}
                  value={form.anioInscripcion}
                  onChange={(e) => setForm({ ...form, anioInscripcion: e.target.value })}
                />
              </label>
            </div>
          </fieldset>

          {editingId ? (
            <fieldset className="inline-form__fieldset">
              <legend>Fotos</legend>
              {fotoError && <p className="auth-card__error">{fotoError}</p>}
              {fotos.length === 0 && (
                <p className="empty-state">Sin fotos publicadas todavía.</p>
              )}
              <div className="fotos-grid">
                {fotos.map((foto) => (
                  <div key={foto.id} className="fotos-grid__item">
                    <img src={foto.archivoUrl} alt={foto.descripcion ?? 'Foto de la propiedad'} />
                    <span>{foto.descripcion || 'Sin descripción'}</span>
                    <button
                      type="button"
                      className="danger danger--small"
                      onClick={() => eliminarFotoConfirmar.pedir(foto.id)}
                    >
                      Eliminar
                    </button>
                  </div>
                ))}
              </div>

              <div className="proveedores-panel__add">
                <input
                  placeholder="Descripción de la foto (opcional)"
                  value={fotoDescripcion}
                  onChange={(e) => setFotoDescripcion(e.target.value)}
                />
              </div>

              <div
                className={`dropzone${arrastrandoFoto ? ' dropzone--arrastrando' : ''}`}
                onDragOver={(e) => {
                  e.preventDefault();
                  setArrastrandoFoto(true);
                }}
                onDragLeave={() => setArrastrandoFoto(false)}
                onDrop={handleDropFoto}
              >
                <span>Elige una foto o arrástrala aquí</span>
                <label className="button-like">
                  {subiendoFoto ? 'Subiendo…' : '+ Subir foto'}
                  <input
                    type="file"
                    accept="image/*"
                    hidden
                    disabled={subiendoFoto}
                    onChange={handleSubirFoto}
                  />
                </label>
              </div>
            </fieldset>
          ) : (
            <fieldset className="inline-form__fieldset">
              <legend>Fotos (opcional)</legend>
              {fotosPendientes.length > 0 && (
                <div className="fotos-grid">
                  {fotosPendientes.map((archivo, index) => (
                    <div key={`${archivo.name}-${index}`} className="fotos-grid__item">
                      <span>{archivo.name}</span>
                      <button
                        type="button"
                        className="danger danger--small"
                        onClick={() => quitarFotoPendiente(index)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}
              {fotosPendientes.length < MAX_FOTOS_PROPIEDAD && (
                <div className="proveedores-panel__add">
                  <label className="button-like">
                    + Elegir fotos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={agregarFotosPendientes}
                    />
                  </label>
                </div>
              )}
            </fieldset>
          )}

          {editingId ? (
            <fieldset className="inline-form__fieldset">
              <legend>Documentos</legend>
              {documentoError && <p className="auth-card__error">{documentoError}</p>}
              {documentos.length === 0 && (
                <p className="empty-state">Sin documentos publicados todavía.</p>
              )}
              {documentos.length > 0 && (
                <div className="proveedores-panel__grid">
                  {documentos.map((doc) => (
                    <div key={doc.id} className="proveedores-panel__row">
                      <span className="proveedores-panel__tipo">{doc.tipo}</span>
                      <span className="proveedores-panel__detalle">
                        Emisión: {doc.fechaEmision ? formatFecha(doc.fechaEmision) : '—'}
                      </span>
                      <span className="proveedores-panel__detalle">
                        Vencimiento: {doc.fechaVencimiento ? formatFecha(doc.fechaVencimiento) : '—'}
                      </span>
                      <span className="proveedores-panel__detalle">
                        <a href={doc.archivoUrl} target="_blank" rel="noreferrer">
                          Ver documento
                        </a>
                      </span>
                      <div className="proveedores-panel__row-actions">
                        <button
                          type="button"
                          className="icon-button icon-button--small icon-button--danger"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => eliminarDocumentoConfirmar.pedir(doc.id)}
                        >
                          <IconEliminar />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              <div className="inline-form__grid">
                <label>
                  Tipo de documento
                  <select
                    value={documentoForm.tipo}
                    onChange={(e) => setDocumentoForm({ ...documentoForm, tipo: e.target.value })}
                  >
                    <option value="">Elige un tipo…</option>
                    {DOCUMENTO_TIPOS_PROPIEDAD.map((t) => (
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
                      onChange={(e) => setDocumentoForm({ ...documentoForm, tipoOtro: e.target.value })}
                    />
                  </label>
                )}
                <label>
                  Fecha de emisión (opcional)
                  <input
                    type="date"
                    value={documentoForm.fechaEmision}
                    onChange={(e) => setDocumentoForm({ ...documentoForm, fechaEmision: e.target.value })}
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
                  <input type="file" hidden disabled={subiendoDocumento} onChange={handleSubirDocumento} />
                </label>
              </div>
            </fieldset>
          ) : (
            <fieldset className="inline-form__fieldset">
              <legend>Documentos (opcional)</legend>
              {documentoError && <p className="auth-card__error">{documentoError}</p>}
              {documentosPendientes.length > 0 && (
                <div className="fotos-grid">
                  {documentosPendientes.map((doc, index) => (
                    <div key={`${doc.archivo.name}-${index}`} className="fotos-grid__item">
                      <span>{doc.tipo}</span>
                      <span>{doc.archivo.name}</span>
                      <button
                        type="button"
                        className="danger danger--small"
                        onClick={() => quitarDocumentoPendiente(index)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <div className="inline-form__grid">
                <label>
                  Tipo de documento
                  <select
                    value={documentoForm.tipo}
                    onChange={(e) => setDocumentoForm({ ...documentoForm, tipo: e.target.value })}
                  >
                    <option value="">Elige un tipo…</option>
                    {DOCUMENTO_TIPOS_PROPIEDAD.map((t) => (
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
                      onChange={(e) => setDocumentoForm({ ...documentoForm, tipoOtro: e.target.value })}
                    />
                  </label>
                )}
                <label>
                  Fecha de emisión (opcional)
                  <input
                    type="date"
                    value={documentoForm.fechaEmision}
                    onChange={(e) => setDocumentoForm({ ...documentoForm, fechaEmision: e.target.value })}
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

              <div className="proveedores-panel__add">
                <label className="button-like">
                  + Elegir documento
                  <input type="file" hidden onChange={agregarDocumentoPendiente} />
                </label>
              </div>
            </fieldset>
          )}

          {editingId && esPiezaForm && (
            <fieldset className="inline-form__fieldset">
              <legend>Cuentas de proveedores</legend>
              <p className="empty-state">
                Esta {form.tipo === 'LOFT' ? 'loft' : 'habitación'} comparte las cuentas de agua/luz/gas
                con {propiedadPadreForm ? `${propiedadPadreForm.calle} ${propiedadPadreForm.numero}` : 'su propiedad madre'}
                . Adminístralas desde ahí.
              </p>
            </fieldset>
          )}

          {editingId && !esPiezaForm && (
            <fieldset className="inline-form__fieldset">
              <legend>Cuentas de proveedores</legend>
              {proveedores.length === 0 && (
                <p className="empty-state">Sin cuentas de proveedores registradas.</p>
              )}
              <div className="proveedores-panel__grid">
                {proveedores.map((proveedor) => (
                  <div key={proveedor.id} className="proveedores-panel__row">
                    <span className="proveedores-panel__tipo">
                      {PROVEEDOR_LABELS[proveedor.tipo]}
                    </span>
                    <span className="proveedores-panel__detalle">Empresa: {proveedor.empresa}</span>
                    <span className="proveedores-panel__detalle">N° cliente: {proveedor.nCliente}</span>
                    <span className="proveedores-panel__detalle">
                      Estado:{' '}
                      <span className={`badge badge--${proveedor.estado.toLowerCase()}`}>
                        {proveedor.estado}
                      </span>
                    </span>
                    <div className="proveedores-panel__row-actions">
                      <button
                        type="button"
                        className="icon-button icon-button--small"
                        title="Editar"
                        aria-label="Editar"
                        onClick={() => abrirEdicionProveedor(proveedor)}
                      >
                        <IconEditar />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--small icon-button--danger"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => eliminarProveedorConfirmar.pedir(proveedor.id)}
                      >
                        <IconEliminar />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="inline-form__grid">
                <label>
                  Tipo
                  <select
                    value={proveedorForm.tipo}
                    onChange={(e) => {
                      const tipo = e.target.value as TipoProveedor;
                      setProveedorForm({
                        ...proveedorForm,
                        tipo,
                        empresa: EMPRESAS_POR_TIPO_PROVEEDOR[tipo][0],
                      });
                    }}
                  >
                    {(Object.keys(PROVEEDOR_LABELS) as TipoProveedor[]).map((tipo) => (
                      <option key={tipo} value={tipo}>
                        {PROVEEDOR_LABELS[tipo]}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Empresa
                  <select
                    value={proveedorForm.empresa}
                    onChange={(e) => setProveedorForm({ ...proveedorForm, empresa: e.target.value })}
                  >
                    {EMPRESAS_POR_TIPO_PROVEEDOR[proveedorForm.tipo].map((empresa) => (
                      <option key={empresa} value={empresa}>
                        {empresa}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  N° cliente
                  <input
                    value={proveedorForm.nCliente}
                    onChange={(e) => setProveedorForm({ ...proveedorForm, nCliente: e.target.value })}
                  />
                </label>
                {editingProveedorId && (
                  <label>
                    Estado
                    <select
                      value={proveedorForm.estado}
                      onChange={(e) =>
                        setProveedorForm({
                          ...proveedorForm,
                          estado: e.target.value as EstadoProveedor,
                        })
                      }
                    >
                      <option value="ACTIVO">ACTIVO</option>
                      <option value="INACTIVO">INACTIVO</option>
                    </select>
                  </label>
                )}
              </div>
              <div className="table__actions">
                <button type="button" onClick={handleGuardarProveedor}>
                  {editingProveedorId ? 'Guardar cambios' : 'Agregar'}
                </button>
                {editingProveedorId && (
                  <button type="button" onClick={cancelarEdicionProveedor}>
                    Cancelar
                  </button>
                )}
              </div>
            </fieldset>
          )}

          {!editingId && esPiezaForm && form.propiedadPadreId && (
            <p className="empty-state">
              Esta {form.tipo === 'LOFT' ? 'loft' : 'habitación'} comparte las cuentas de agua/luz/gas con{' '}
              {propiedadPadreForm ? `${propiedadPadreForm.calle} ${propiedadPadreForm.numero}` : 'su propiedad madre'}
              .
            </p>
          )}

          {!editingId && !esPiezaForm && (
            <fieldset className="inline-form__fieldset">
              <legend>Cuentas de proveedores (opcional)</legend>
              <div className="inline-form__grid">
                <label>
                  Empresa agua
                  <select
                    value={form.aguaEmpresa}
                    onChange={(e) => setForm({ ...form, aguaEmpresa: e.target.value })}
                  >
                    {EMPRESAS_POR_TIPO_PROVEEDOR.AGUA.map((empresa) => (
                      <option key={empresa} value={empresa}>
                        {empresa}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  N° cliente agua
                  <input
                    value={form.aguaCliente}
                    onChange={(e) => setForm({ ...form, aguaCliente: e.target.value })}
                  />
                </label>
                <label>
                  Empresa luz
                  <select
                    value={form.luzEmpresa}
                    onChange={(e) => setForm({ ...form, luzEmpresa: e.target.value })}
                  >
                    {EMPRESAS_POR_TIPO_PROVEEDOR.LUZ.map((empresa) => (
                      <option key={empresa} value={empresa}>
                        {empresa}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  N° cliente luz
                  <input
                    value={form.luzCliente}
                    onChange={(e) => setForm({ ...form, luzCliente: e.target.value })}
                  />
                </label>
                <label>
                  Empresa gas
                  <select
                    value={form.gasEmpresa}
                    onChange={(e) => setForm({ ...form, gasEmpresa: e.target.value })}
                  >
                    {EMPRESAS_POR_TIPO_PROVEEDOR.GAS.map((empresa) => (
                      <option key={empresa} value={empresa}>
                        {empresa}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  N° cliente gas
                  <input
                    value={form.gasCliente}
                    onChange={(e) => setForm({ ...form, gasCliente: e.target.value })}
                  />
                </label>
              </div>
            </fieldset>
          )}

          {error && <p className="auth-card__error">{error}</p>}

          <button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Guardar propiedad'}
          </button>
        </form>
        </Modal>
      )}

      {loading && <p>Cargando…</p>}

      {!loading && loadError && <p className="error-text">{loadError}</p>}

      {!loading && !loadError && propiedades.length === 0 && (
        <p className="empty-state">Aún no has agregado propiedades.</p>
      )}

      {!loading && !loadError && propiedades.length > 0 && (
        <div className="table-wrap" data-tour="propiedades-tabla">
          <table className="table">
            <thead>
              <tr>
                {(
                  [
                    ['rol', 'Rol'],
                    ['direccion', 'Dirección'],
                    ['ubicacion', 'Ubicación'],
                    ['tipo', 'Tipo'],
                    ['nHabitaciones', 'Hab'],
                    ['nBanos', 'Baños'],
                    ['mt2Totales', 'M² totales'],
                    ['mt2Construidos', 'M² construidos'],
                    ['estado', 'Estado'],
                  ] as Array<[CampoOrdenable, string]>
                ).map(([campo, etiqueta]) => (
                  <th key={campo} className="th-sortable" onClick={() => toggleSort(campo)}>
                    {etiqueta}
                    <span className="th-sortable__arrow">
                      {sortField === campo ? (sortDir === 'asc' ? ' ▲' : ' ▼') : ''}
                    </span>
                  </th>
                ))}
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {propiedadesAgrupadas.map((propiedad) => (
                  <tr key={propiedad.id}>
                    <td
                      className="cell-editable"
                      onClick={() => startEditCell(propiedad, 'rol')}
                    >
                      {editingCell?.id === propiedad.id && editingCell.campo === 'rol' ? (
                        <input
                          autoFocus
                          className="cell-input"
                          value={cellValue}
                          onChange={(e) => setCellValue(e.target.value)}
                          onBlur={() => commitCellEdit(propiedad)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                            if (e.key === 'Escape') setEditingCell(null);
                          }}
                        />
                      ) : (
                        propiedad.rol
                      )}
                    </td>
                    <td style={propiedad.propiedadPadreId ? { paddingLeft: '1.75rem' } : undefined}>
                      {propiedad.propiedadPadreId ? '↳ ' : ''}
                      {propiedad.calle} {propiedad.numero}
                      {sufijoUnidadPropiedad(propiedad)}
                    </td>
                    <td>
                      {propiedad.sector ? `${propiedad.sector}, ` : ''}
                      {propiedad.ciudad}
                    </td>
                    <td>
                      <select
                        className={`cell-select badge badge--${propiedad.tipo.toLowerCase()}`}
                        value={propiedad.tipo}
                        onChange={(e) => guardarCampo(propiedad.id, 'tipo', e.target.value)}
                      >
                        {TIPOS.map((t) => (
                          <option key={t} value={t}>
                            {t}
                          </option>
                        ))}
                      </select>
                    </td>
                    {(
                      ['nHabitaciones', 'nBanos', 'mt2Totales', 'mt2Construidos'] as CampoCelda[]
                    ).map((campo) => (
                      <td
                        key={campo}
                        className="cell-editable"
                        onClick={() => startEditCell(propiedad, campo)}
                      >
                        {editingCell?.id === propiedad.id && editingCell.campo === campo ? (
                          <input
                            autoFocus
                            type="number"
                            step={campo === 'mt2Totales' || campo === 'mt2Construidos' ? '0.01' : '1'}
                            min={0}
                            className="cell-input"
                            value={cellValue}
                            onChange={(e) => setCellValue(e.target.value)}
                            onBlur={() => commitCellEdit(propiedad)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
                              if (e.key === 'Escape') setEditingCell(null);
                            }}
                          />
                        ) : (
                          propiedad[campo]
                        )}
                      </td>
                    ))}
                    <td>
                      <select
                        className={`cell-select badge badge--${propiedad.estado.toLowerCase()}`}
                        value={propiedad.estado}
                        onChange={(e) => guardarCampo(propiedad.id, 'estado', e.target.value)}
                      >
                        {ESTADOS_PROPIEDAD.map((estado) => (
                          <option key={estado} value={estado}>
                            {formatEnumLabel(estado)}
                          </option>
                        ))}
                      </select>
                    </td>
                    <td>
                      <div className="table__actions">
                        <button
                          type="button"
                          className="icon-button"
                          title="Editar"
                          aria-label="Editar"
                          onClick={() => abrirEdicion(propiedad)}
                        >
                          <IconEditar />
                        </button>
                        <button
                          type="button"
                          className="icon-button"
                          title="Duplicar"
                          aria-label="Duplicar"
                          onClick={() => handleDuplicar(propiedad.id)}
                        >
                          <IconDuplicar />
                        </button>
                        <button
                          type="button"
                          className="icon-button icon-button--danger"
                          title="Eliminar"
                          aria-label="Eliminar"
                          onClick={() => eliminarPropiedad.pedir(propiedad.id)}
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
      {eliminarPropiedad.modal}
      {eliminarFotoConfirmar.modal}
      {eliminarProveedorConfirmar.modal}
      {tour.activo && !loading && (
        <OnboardingTour steps={PROPIEDADES_TOUR_STEPS} onCerrar={tour.cerrar} />
      )}
    </div>
  );
}
