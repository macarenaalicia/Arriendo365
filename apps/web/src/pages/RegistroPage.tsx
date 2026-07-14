import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth/AuthContext';
import { ApiError } from '../api/client';

export function RegistroPage() {
  const { registrarOrganizacion } = useAuth();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    nombreOrganizacion: '',
    nombreCompleto: '',
    rut: '',
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const update = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }));

  const handleSubmit = async (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    setLoading(true);
    try {
      await registrarOrganizacion(form);
      navigate('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo crear la organización');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-screen">
      <form className="auth-card" onSubmit={handleSubmit}>
        <h1>Crear organización</h1>
        <p className="auth-card__subtitle">Regístrate para empezar a administrar tus arriendos</p>

        <label htmlFor="nombreOrganizacion">Nombre de la organización</label>
        <input
          id="nombreOrganizacion"
          required
          value={form.nombreOrganizacion}
          onChange={update('nombreOrganizacion')}
        />

        <label htmlFor="nombreCompleto">Tu nombre completo</label>
        <input
          id="nombreCompleto"
          required
          value={form.nombreCompleto}
          onChange={update('nombreCompleto')}
        />

        <label htmlFor="rut">RUT</label>
        <input id="rut" required value={form.rut} onChange={update('rut')} />

        <label htmlFor="email">Email</label>
        <input
          id="email"
          type="email"
          required
          value={form.email}
          onChange={update('email')}
        />

        <label htmlFor="password">Contraseña</label>
        <input
          id="password"
          type="password"
          required
          minLength={8}
          value={form.password}
          onChange={update('password')}
        />

        {error && <p className="auth-card__error">{error}</p>}

        <button type="submit" disabled={loading}>
          {loading ? 'Creando…' : 'Crear organización'}
        </button>

        <p className="auth-card__footer">
          ¿Ya tienes cuenta? <Link to="/login">Inicia sesión</Link>
        </p>
      </form>
    </div>
  );
}
