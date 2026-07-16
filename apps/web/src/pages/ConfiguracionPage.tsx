import { useState } from 'react';
import { api, ApiError } from '../api/client';

const FORM_INICIAL = {
  passwordActual: '',
  passwordNueva: '',
  passwordConfirmar: '',
};

export function ConfiguracionPage() {
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [exito, setExito] = useState(false);
  const [saving, setSaving] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setExito(false);

    if (form.passwordNueva.length < 8) {
      setError('La nueva contraseña debe tener al menos 8 caracteres.');
      return;
    }
    if (form.passwordNueva !== form.passwordConfirmar) {
      setError('La confirmación no coincide con la nueva contraseña.');
      return;
    }

    setSaving(true);
    try {
      await api.patch('/perfil/password', {
        passwordActual: form.passwordActual,
        passwordNueva: form.passwordNueva,
      });
      setForm(FORM_INICIAL);
      setExito(true);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo cambiar la contraseña');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h1>Configuración</h1>
      <form className="inline-form" onSubmit={handleSubmit}>
        <h2>Cambiar contraseña</h2>
        <label>
          Contraseña actual
          <input
            type="password"
            required
            value={form.passwordActual}
            onChange={(e) => setForm({ ...form, passwordActual: e.target.value })}
          />
        </label>
        <label>
          Nueva contraseña
          <input
            type="password"
            required
            value={form.passwordNueva}
            onChange={(e) => setForm({ ...form, passwordNueva: e.target.value })}
          />
        </label>
        <label>
          Confirmar nueva contraseña
          <input
            type="password"
            required
            value={form.passwordConfirmar}
            onChange={(e) => setForm({ ...form, passwordConfirmar: e.target.value })}
          />
        </label>

        {error && <p className="auth-card__error">{error}</p>}
        {exito && <p className="form-success">Contraseña actualizada correctamente.</p>}

        <button type="submit" disabled={saving}>
          {saving ? 'Guardando…' : 'Guardar contraseña'}
        </button>
      </form>
    </div>
  );
}
