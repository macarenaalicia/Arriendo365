import { useState } from 'react';
import { api, ApiError } from '../api/client';
import type { CalificacionRequerimiento } from '../api/types';

interface CalificacionSelectProps {
  calificaciones: CalificacionRequerimiento[];
  value: string;
  onChange: (id: string) => void;
  /** Solo staff (administrador/propietario/técnico) puede crear nuevas calificaciones. */
  permitirCrear?: boolean;
  onCalificacionCreada?: (calificacion: CalificacionRequerimiento) => void;
}

const NUEVA = '__nueva__';

/** Select del mantenedor "Calificación" (reemplaza el texto libre "tipo de reparación"). */
export function CalificacionSelect({
  calificaciones,
  value,
  onChange,
  permitirCrear,
  onCalificacionCreada,
}: CalificacionSelectProps) {
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSeleccion = (id: string) => {
    if (id === NUEVA) {
      setCreando(true);
      setError(null);
      return;
    }
    onChange(id);
  };

  const handleCrear = async () => {
    if (!nombre.trim()) return;
    setGuardando(true);
    setError(null);
    try {
      const calificacion = await api.post<CalificacionRequerimiento>('/calificaciones-requerimiento', {
        nombre: nombre.trim(),
      });
      onCalificacionCreada?.(calificacion);
      onChange(calificacion.id);
      setCreando(false);
      setNombre('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la calificación');
    } finally {
      setGuardando(false);
    }
  };

  if (creando) {
    return (
      <div className="proveedores-panel__add">
        <input
          autoFocus
          placeholder="Nombre de la calificación (ej. Eléctrica)"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <button type="button" disabled={guardando || !nombre.trim()} onClick={handleCrear}>
          {guardando ? 'Creando…' : 'Crear calificación'}
        </button>
        <button
          type="button"
          className="link-button"
          onClick={() => {
            setCreando(false);
            setNombre('');
            setError(null);
          }}
        >
          Cancelar
        </button>
        {error && <p className="auth-card__error">{error}</p>}
      </div>
    );
  }

  return (
    <select required value={value} onChange={(e) => handleSeleccion(e.target.value)}>
      <option value="">Elige una calificación…</option>
      {calificaciones.map((c) => (
        <option key={c.id} value={c.id}>
          {c.nombre}
        </option>
      ))}
      {permitirCrear && <option value={NUEVA}>+ Agregar nueva calificación</option>}
    </select>
  );
}
