import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { formatEnumLabel } from '../lib/format';

interface Perfil {
  nombreCompleto: string;
  rut: string | null;
  email: string | null;
  telefono: string | null;
  rol: string;
}

export function PerfilPage() {
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    api
      .get<Perfil>('/perfil')
      .then((data) => {
        setPerfil(data);
        setEmail(data.email ?? '');
        setTelefono(data.telefono ?? '');
      })
      .catch(() => setLoadError('No se pudo cargar el perfil'))
      .finally(() => setLoading(false));
  }, []);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setExito(false);
    setSaving(true);
    try {
      const actualizado = await api.patch<Perfil>('/perfil', {
        email: email || undefined,
        telefono: telefono || undefined,
      });
      setPerfil(actualizado);
      setExito(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo actualizar el perfil');
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <p>Cargando…</p>;
  if (loadError) return <p className="error-text">{loadError}</p>;
  if (!perfil) return null;

  return (
    <div>
      <h1>Perfil</h1>
      <section className="detail-grid">
        <div className="detail-card perfil-card">
          <h2>Mis datos</h2>
          <div className="perfil-field">
            <span className="perfil-field__label">Nombre completo</span>
            <span className="perfil-field__value">{perfil.nombreCompleto}</span>
          </div>
          {perfil.rut && (
            <div className="perfil-field">
              <span className="perfil-field__label">RUT</span>
              <span className="perfil-field__value">{perfil.rut}</span>
            </div>
          )}
          <div className="perfil-field">
            <span className="perfil-field__label">Rol</span>
            <span className="perfil-field__value">
              <span className={`badge badge--${perfil.rol.toLowerCase()}`}>
                {formatEnumLabel(perfil.rol)}
              </span>
            </span>
          </div>
        </div>

        <div className="detail-card perfil-card">
          <h2>Contacto</h2>
          <form className="perfil-form" onSubmit={handleSubmit}>
            <label>
              Email
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
            </label>
            <label>
              Número de contacto
              <input value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </label>

            {error && <p className="auth-card__error">{error}</p>}
            {exito && <p className="form-success">Datos actualizados correctamente.</p>}

            <button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar cambios'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
