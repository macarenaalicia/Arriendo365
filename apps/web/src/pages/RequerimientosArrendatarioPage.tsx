import { Fragment, useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import {
  HistorialRequerimientoBoton,
  HistorialRequerimientoFilas,
} from '../components/HistorialRequerimiento';
import { eliminarFoto, listarFotos, subirFoto } from '../lib/fotos';
import { useConfirmarEliminar } from '../lib/useConfirmarEliminar';
import { useCalificaciones } from '../lib/useCalificaciones';
import { descargarArchivo } from '../lib/descargas';
import { CalificacionSelect } from '../components/CalificacionSelect';
import { IconDescargar } from '../components/icons';
import type { ArriendoPropiedad, Foto, Requerimiento, UrgenciaRequerimiento } from '../api/types';

const URGENCIAS: UrgenciaRequerimiento[] = ['BAJA', 'MEDIA', 'CRITICA'];
const MAX_FOTOS_REQUERIMIENTO = 10;

const REQ_FORM_INICIAL = {
  urgencia: 'MEDIA' as UrgenciaRequerimiento,
  calificacionId: '',
  notasArrendatario: '',
};

interface BloqueArriendoProps {
  arriendo: ArriendoPropiedad;
  requerimientos: Requerimiento[];
  expandidoInicial: boolean;
  colapsable: boolean;
  onCreado: () => void;
}

function BloqueArriendoRequerimientos({
  arriendo,
  requerimientos,
  expandidoInicial,
  colapsable,
  onCreado,
}: BloqueArriendoProps) {
  const [expandido, setExpandido] = useState(expandidoInicial);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(REQ_FORM_INICIAL);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [historialAbiertoId, setHistorialAbiertoId] = useState<string | null>(null);
  const [descargandoId, setDescargandoId] = useState<string | null>(null);
  const { calificaciones } = useCalificaciones();

  const handleDescargar = async (reqId: string) => {
    setDescargandoId(reqId);
    try {
      await descargarArchivo(`/requerimientos/${reqId}/descarga.pdf`, `requerimiento-${reqId}.pdf`);
    } finally {
      setDescargandoId(null);
    }
  };

  const [fotosAbiertoId, setFotosAbiertoId] = useState<string | null>(null);
  const [fotos, setFotos] = useState<Foto[]>([]);
  const [fotoDescripcion, setFotoDescripcion] = useState('');
  const [subiendoFoto, setSubiendoFoto] = useState(false);
  const [fotoError, setFotoError] = useState<string | null>(null);
  const [arrastrandoFotoExistente, setArrastrandoFotoExistente] = useState(false);

  const toggleFotos = async (reqId: string) => {
    if (fotosAbiertoId === reqId) {
      setFotosAbiertoId(null);
      return;
    }
    setFotosAbiertoId(reqId);
    setFotoDescripcion('');
    setFotoError(null);
    const lista = await listarFotos('requerimiento', reqId);
    setFotos(lista);
  };

  const subirArchivoFotoExistente = async (reqId: string, archivo: File) => {
    if (fotos.length >= MAX_FOTOS_REQUERIMIENTO) {
      setFotoError(`Máximo ${MAX_FOTOS_REQUERIMIENTO} fotos por requerimiento.`);
      return;
    }
    setFotoError(null);
    setSubiendoFoto(true);
    try {
      await subirFoto(archivo, 'requerimiento', reqId, fotoDescripcion || undefined);
      setFotoDescripcion('');
      const lista = await listarFotos('requerimiento', reqId);
      setFotos(lista);
    } catch (err) {
      setFotoError(err instanceof ApiError ? err.message : 'No se pudo subir la foto');
    } finally {
      setSubiendoFoto(false);
    }
  };

  const handleSubirFoto = (reqId: string, event: React.ChangeEvent<HTMLInputElement>) => {
    const archivo = event.target.files?.[0];
    event.target.value = '';
    if (archivo) subirArchivoFotoExistente(reqId, archivo);
  };

  const handleDropFotoExistente = (reqId: string, event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastrandoFotoExistente(false);
    const archivo = event.dataTransfer.files?.[0];
    if (archivo) subirArchivoFotoExistente(reqId, archivo);
  };

  const handleEliminarFoto = async (fotoId: string) => {
    await eliminarFoto(fotoId);
    setFotos((prev) => prev.filter((f) => f.id !== fotoId));
  };
  const eliminarFotoConfirmar = useConfirmarEliminar<string>(handleEliminarFoto);

  const [archivosPendientes, setArchivosPendientes] = useState<File[]>([]);
  const [arrastrandoFoto, setArrastrandoFoto] = useState(false);

  const abrirCreacion = () => {
    setForm(REQ_FORM_INICIAL);
    setArchivosPendientes([]);
    setError(null);
    setShowForm(true);
  };

  const agregarArchivos = (lista: FileList | null) => {
    const nuevos = Array.from(lista ?? []).filter((archivo) => archivo.type.startsWith('image/'));
    if (nuevos.length === 0) return;
    setArchivosPendientes((prev) =>
      [...prev, ...nuevos].slice(0, MAX_FOTOS_REQUERIMIENTO),
    );
  };

  const agregarArchivosPendientes = (event: React.ChangeEvent<HTMLInputElement>) => {
    agregarArchivos(event.target.files);
    event.target.value = '';
  };

  const handleDropFotos = (event: React.DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setArrastrandoFoto(false);
    agregarArchivos(event.dataTransfer.files);
  };

  const quitarArchivoPendiente = (index: number) => {
    setArchivosPendientes((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const creado = await api.post<Requerimiento>('/requerimientos', {
        arriendoPropiedadId: arriendo.id,
        urgencia: form.urgencia,
        calificacionId: form.calificacionId,
        notasArrendatario: form.notasArrendatario || undefined,
      });

      for (const archivo of archivosPendientes) {
        await subirFoto(archivo, 'requerimiento', creado.id);
      }

      setForm(REQ_FORM_INICIAL);
      setArchivosPendientes([]);
      setShowForm(false);
      onCreado();
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : 'El requerimiento pudo haberse creado, pero alguna foto no se subió. Revisa la lista.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="detail-card pagos-arrendatario__bloque">
      <div
        className="page-header"
        style={colapsable ? { cursor: 'pointer' } : undefined}
        onClick={colapsable ? () => setExpandido((v) => !v) : undefined}
      >
        <h2>
          {colapsable ? (expandido ? '▾ ' : '▸ ') : ''}
          {arriendo.propiedad.calle} {arriendo.propiedad.numero}
        </h2>
        {expandido && (
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation();
              showForm ? setShowForm(false) : abrirCreacion();
            }}
          >
            {showForm ? 'Cancelar' : '+ Reportar requerimiento'}
          </button>
        )}
      </div>

      {expandido && (
        <>

          {showForm && (
            <form className="inline-form" onSubmit={handleSubmit}>
              <div className="inline-form__grid">
                <label>
                  Urgencia
                  <select
                    value={form.urgencia}
                    onChange={(e) =>
                      setForm({ ...form, urgencia: e.target.value as UrgenciaRequerimiento })
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
                  Calificación
                  <CalificacionSelect
                    calificaciones={calificaciones}
                    value={form.calificacionId}
                    onChange={(calificacionId) => setForm({ ...form, calificacionId })}
                  />
                </label>
              </div>

              {archivosPendientes.length < MAX_FOTOS_REQUERIMIENTO ? (
                <div
                  className={`inline-form__fotos${arrastrandoFoto ? ' inline-form__fotos--arrastrando' : ''}`}
                  onDragOver={(e) => {
                    e.preventDefault();
                    setArrastrandoFoto(true);
                  }}
                  onDragLeave={() => setArrastrandoFoto(false)}
                  onDrop={handleDropFotos}
                >
                  <span>
                    Fotos (opcional, máx. {MAX_FOTOS_REQUERIMIENTO}) — elige un archivo o
                    arrástralo aquí
                  </span>
                  <label className="button-like">
                    + Elegir fotos
                    <input
                      type="file"
                      accept="image/*"
                      multiple
                      hidden
                      onChange={agregarArchivosPendientes}
                    />
                  </label>
                </div>
              ) : (
                <p className="empty-state">Máximo {MAX_FOTOS_REQUERIMIENTO} fotos alcanzado.</p>
              )}

              {archivosPendientes.length > 0 && (
                <div className="fotos-grid">
                  {archivosPendientes.map((archivo, index) => (
                    <div key={`${archivo.name}-${index}`} className="fotos-grid__item">
                      <span>{archivo.name}</span>
                      <button
                        type="button"
                        className="danger danger--small"
                        onClick={() => quitarArchivoPendiente(index)}
                      >
                        Quitar
                      </button>
                    </div>
                  ))}
                </div>
              )}

              <label>
                Descripción
                <textarea
                  placeholder="Describe el problema…"
                  value={form.notasArrendatario}
                  onChange={(e) => setForm({ ...form, notasArrendatario: e.target.value })}
                />
              </label>

              {error && <p className="auth-card__error">{error}</p>}

              <button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Reportar'}
              </button>
            </form>
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
                    <th style={{ width: '120px' }}>Calificación</th>
                    <th style={{ width: '130px' }}>Estado</th>
                    <th style={{ width: '150px' }}>Técnico</th>
                    <th>Descripción</th>
                    <th style={{ width: '160px' }}>Resolución</th>
                    <th style={{ width: '90px' }}>Fotos</th>
                    <th style={{ width: '110px' }}>Historial</th>
                    <th style={{ width: '60px' }}>Descargar</th>
                  </tr>
                </thead>
                <tbody>
                  {requerimientos.map((req) => {
                    const historialAbierto = historialAbiertoId === req.id;
                    const fotosAbierto = fotosAbiertoId === req.id;
                    return (
                      <Fragment key={req.id}>
                        <tr>
                          <td>
                            <span className={`badge badge--${req.urgencia.toLowerCase()}`}>
                              {req.urgencia}
                            </span>
                          </td>
                          <td>{req.calificacion.nombre}</td>
                          <td className="table__cell-wrap">
                            <span className={`badge badge--${req.estado.toLowerCase()}`}>
                              {req.estado.replace(/_/g, ' ')}
                            </span>
                          </td>
                          <td className="table__cell-wrap">{req.tecnico?.nombreCompleto ?? ''}</td>
                          <td className="table__cell-wrap">{req.notasArrendatario ?? ''}</td>
                          <td className="table__cell-wrap">{req.detalleResolucion ?? ''}</td>
                          <td>
                            <button
                              type="button"
                              className={`historial-toggle${fotosAbierto ? ' historial-toggle--abierto' : ''}`}
                              onClick={() => toggleFotos(req.id)}
                            >
                              {fotosAbierto ? 'Ocultar' : 'Fotos'}
                            </button>
                          </td>
                          <td>
                            <HistorialRequerimientoBoton
                              actualizaciones={req.actualizaciones}
                              abierto={historialAbierto}
                              onToggle={() =>
                                setHistorialAbiertoId(historialAbierto ? null : req.id)
                              }
                            />
                          </td>
                          <td>
                            <button
                              type="button"
                              className="icon-button"
                              title="Descargar"
                              aria-label="Descargar"
                              disabled={descargandoId === req.id}
                              onClick={() => handleDescargar(req.id)}
                            >
                              <IconDescargar />
                            </button>
                          </td>
                        </tr>
                        {historialAbierto && (
                          <HistorialRequerimientoFilas
                            actualizaciones={req.actualizaciones}
                            colSpan={9}
                          />
                        )}
                        {fotosAbierto && (
                          <tr>
                            <td colSpan={9}>
                              <div className="proveedores-panel">
                                {fotoError && <p className="auth-card__error">{fotoError}</p>}
                                {fotos.length === 0 && (
                                  <p className="empty-state">Sin fotos adjuntas todavía.</p>
                                )}
                                <div className="fotos-grid">
                                  {fotos.map((foto) => (
                                    <div key={foto.id} className="fotos-grid__item">
                                      <img
                                        src={foto.archivoUrl}
                                        alt={foto.descripcion ?? 'Foto del requerimiento'}
                                      />
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

                                {fotos.length < MAX_FOTOS_REQUERIMIENTO ? (
                                  <>
                                    <div className="proveedores-panel__add">
                                      <input
                                        placeholder="Descripción de la foto (opcional)"
                                        value={fotoDescripcion}
                                        onChange={(e) => setFotoDescripcion(e.target.value)}
                                      />
                                    </div>

                                    <div
                                      className={`dropzone${arrastrandoFotoExistente ? ' dropzone--arrastrando' : ''}`}
                                      onDragOver={(e) => {
                                        e.preventDefault();
                                        setArrastrandoFotoExistente(true);
                                      }}
                                      onDragLeave={() => setArrastrandoFotoExistente(false)}
                                      onDrop={(e) => handleDropFotoExistente(req.id, e)}
                                    >
                                      <span>Elige una foto o arrástrala aquí</span>
                                      <label className="button-like">
                                        {subiendoFoto ? 'Subiendo…' : '+ Subir foto'}
                                        <input
                                          type="file"
                                          accept="image/*"
                                          hidden
                                          disabled={subiendoFoto}
                                          onChange={(e) => handleSubirFoto(req.id, e)}
                                        />
                                      </label>
                                    </div>
                                  </>
                                ) : (
                                  <p className="empty-state">
                                    Máximo {MAX_FOTOS_REQUERIMIENTO} fotos alcanzado.
                                  </p>
                                )}
                              </div>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
      {eliminarFotoConfirmar.modal}
    </section>
  );
}

export function RequerimientosArrendatarioPage() {
  const [arriendos, setArriendos] = useState<ArriendoPropiedad[]>([]);
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const cargarRequerimientos = () => {
    api.get<Requerimiento[]>('/requerimientos').then(setRequerimientos);
  };

  useEffect(() => {
    Promise.all([
      api.get<ArriendoPropiedad[]>('/arriendos-propiedad'),
      api.get<Requerimiento[]>('/requerimientos'),
    ])
      .then(([arriendosData, requerimientosData]) => {
        setArriendos(arriendosData);
        setRequerimientos(requerimientosData);
      })
      .catch(() => setLoadError('No se pudo cargar tus requerimientos'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <p>Cargando…</p>;
  if (loadError) return <p className="error-text">{loadError}</p>;

  const soloUnArriendo = arriendos.length === 1;

  return (
    <div>
      <h1>Requerimientos</h1>

      {arriendos.length === 0 && (
        <p className="empty-state">No tienes arriendos asociados.</p>
      )}

      {arriendos.map((arriendo) => (
        <BloqueArriendoRequerimientos
          key={arriendo.id}
          arriendo={arriendo}
          requerimientos={requerimientos.filter((r) => r.arriendoPropiedadId === arriendo.id)}
          expandidoInicial={soloUnArriendo}
          colapsable={!soloUnArriendo}
          onCreado={cargarRequerimientos}
        />
      ))}
    </div>
  );
}
