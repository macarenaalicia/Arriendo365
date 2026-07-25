import { useEffect, useState } from 'react';
import { api, ApiError } from '../api/client';
import { formatEnumLabel } from '../lib/format';
import { useAuth } from '../auth/AuthContext';

interface Perfil {
  nombreCompleto: string;
  rut: string | null;
  email: string | null;
  telefono: string | null;
  rol: string;
  debeCambiarPassword: boolean;
}

export function PerfilPage() {
  const { marcarPasswordCambiada } = useAuth();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);

  const [email, setEmail] = useState('');
  const [telefono, setTelefono] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [saving, setSaving] = useState(false);

  const [passwordActual, setPasswordActual] = useState('');
  const [passwordNueva, setPasswordNueva] = useState('');
  const [passwordError, setPasswordError] = useState<string | null>(null);
  const [passwordExito, setPasswordExito] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);

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

  const handleSubmitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setPasswordError(null);
    setPasswordExito(false);
    setSavingPassword(true);
    try {
      await api.patch('/perfil/password', { passwordActual, passwordNueva });
      setPasswordActual('');
      setPasswordNueva('');
      setPasswordExito(true);
      setPerfil((prev) => (prev ? { ...prev, debeCambiarPassword: false } : prev));
      marcarPasswordCambiada();
    } catch (err) {
      setPasswordError(err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSavingPassword(false);
    }
  };

  if (loading) return <p>Cargando…</p>;
  if (loadError) return <p className="error-text">{loadError}</p>;
  if (!perfil) return null;

  return (
    <div>
      <h1>Perfil</h1>

      {perfil.debeCambiarPassword && (
        <p className="auth-card__error">
          Por seguridad debes cambiar tu contraseña inicial antes de seguir usando el sistema.
        </p>
      )}

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

        <div className="detail-card perfil-card">
          <h2>Cambiar contraseña</h2>
          <form className="perfil-form" onSubmit={handleSubmitPassword}>
            <label>
              Contraseña actual
              <input
                type="password"
                required
                value={passwordActual}
                onChange={(e) => setPasswordActual(e.target.value)}
              />
            </label>
            <label>
              Contraseña nueva
              <input
                type="password"
                required
                minLength={8}
                value={passwordNueva}
                onChange={(e) => setPasswordNueva(e.target.value)}
              />
            </label>

            {passwordError && <p className="auth-card__error">{passwordError}</p>}
            {passwordExito && <p className="form-success">Contraseña actualizada correctamente.</p>}

            <button type="submit" disabled={savingPassword}>
              {savingPassword ? 'Guardando…' : 'Cambiar contraseña'}
            </button>
          </form>
        </div>
      </section>
    </div>
  );
}
