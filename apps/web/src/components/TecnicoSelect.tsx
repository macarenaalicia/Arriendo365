import { useState } from 'react';
import { api, ApiError } from '../api/client';
import type { Persona } from '../api/types';

interface TecnicoSelectProps {
  personas: Persona[];
  value: string;
  onChange: (id: string) => void;
  onPersonaCreada: (persona: Persona) => void;
}

const NUEVO = '__nuevo__';

/** Select de técnico cuya última opción permite crear uno nuevo sin salir del formulario. */
export function TecnicoSelect({ personas, value, onChange, onPersonaCreada }: TecnicoSelectProps) {
  const [creando, setCreando] = useState(false);
  const [nombre, setNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const tecnicos = personas.filter((p) => p.tipoPersona === 'TECNICO' || p.id === value);

  const handleSeleccion = (id: string) => {
    if (id === NUEVO) {
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
      const persona = await api.post<Persona>('/personas', {
        nombreCompleto: nombre.trim(),
        tipoPersona: 'TECNICO',
      });
      onPersonaCreada(persona);
      onChange(persona.id);
      setCreando(false);
      setNombre('');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear el técnico');
    } finally {
      setGuardando(false);
    }
  };

  if (creando) {
    return (
      <div className="proveedores-panel__add">
        <input
          autoFocus
          placeholder="Nombre completo del nuevo técnico"
          value={nombre}
          onChange={(e) => setNombre(e.target.value)}
        />
        <button type="button" disabled={guardando || !nombre.trim()} onClick={handleCrear}>
          {guardando ? 'Creando…' : 'Crear técnico'}
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
    <select value={value} onChange={(e) => handleSeleccion(e.target.value)}>
      <option value="">Sin asignar</option>
      {tecnicos.map((p) => (
        <option key={p.id} value={p.id}>
          {p.nombreCompleto}
        </option>
      ))}
      <option value={NUEVO}>+ Agregar nuevo técnico</option>
    </select>
  );
}
