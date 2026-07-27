import { useEffect, useState } from 'react';
import { Navigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type { CuentaBancaria, TipoCuentaBancaria } from '../api/types';
import { TIPO_CUENTA_BANCARIA_LABELS } from '../api/types';
import { Modal } from '../components/Modal';
import { useConfirmarEliminar } from '../lib/useConfirmarEliminar';
import { IconEditar, IconEliminar } from '../components/icons';

const TIPOS_CUENTA: TipoCuentaBancaria[] = ['CORRIENTE', 'VISTA', 'AHORRO'];

const FORM_INICIAL = {
  alias: '',
  banco: '',
  tipoCuenta: 'CORRIENTE' as TipoCuentaBancaria,
  numero: '',
  titular: '',
  rut: '',
  email: '',
};

export function CuentasBancariasPage() {
  const { rol, bienesRestringidos } = useAuth();
  const [cuentas, setCuentas] = useState<CuentaBancaria[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    setLoading(true);
    api
      .get<CuentaBancaria[]>('/cuentas-bancarias')
      .then(setCuentas)
      .finally(() => setLoading(false));
  };

  useEffect(cargar, []);

  const abrirCreacion = () => {
    setEditingId(null);
    setForm(FORM_INICIAL);
    setError(null);
    setShowForm(true);
  };

  const abrirEdicion = (cuenta: CuentaBancaria) => {
    setEditingId(cuenta.id);
    setForm({
      alias: cuenta.alias,
      banco: cuenta.banco,
      tipoCuenta: cuenta.tipoCuenta,
      numero: cuenta.numero,
      titular: cuenta.titular,
      rut: cuenta.rut,
      email: cuenta.email ?? '',
    });
    setError(null);
    setShowForm(true);
  };

  const cerrarForm = () => {
    setShowForm(false);
    setError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setSaving(true);
    try {
      const payload = {
        alias: form.alias,
        banco: form.banco,
        tipoCuenta: form.tipoCuenta,
        numero: form.numero,
        titular: form.titular,
        rut: form.rut,
        email: form.email || undefined,
      };
      if (editingId) {
        await api.patch(`/cuentas-bancarias/${editingId}`, payload);
      } else {
        await api.post('/cuentas-bancarias', payload);
      }
      cerrarForm();
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo guardar la cuenta bancaria');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id: string) => {
    await api.delete(`/cuentas-bancarias/${id}`);
    cargar();
  };
  const eliminar = useConfirmarEliminar<string>(handleDelete);

  // Datos bancarios son información sensible que abarca a toda la
  // organización: mismo criterio que Personas/Usuarios.
  if (rol === 'TECNICO' || bienesRestringidos) {
    return <Navigate to="/" replace />;
  }

  return (
    <div>
      <div className="page-header">
        <h1>Cuentas bancarias</h1>
        <div className="page-header__actions">
          <button type="button" onClick={abrirCreacion}>
            + Nueva cuenta
          </button>
        </div>
      </div>

      {!loading && cuentas.length === 0 && (
        <p className="empty-state">
          Aún no has agregado cuentas bancarias. Se usan para que cada arriendo indique dónde
          transferir el pago.
        </p>
      )}

      {!loading && cuentas.length > 0 && (
        <div className="table-wrap">
          <table className="table">
            <thead>
              <tr>
                <th>Alias</th>
                <th>Banco</th>
                <th>Tipo</th>
                <th>Número</th>
                <th>Titular</th>
                <th>RUT</th>
                <th>Email</th>
                <th>Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cuentas.map((cuenta) => (
                <tr key={cuenta.id}>
                  <td>{cuenta.alias}</td>
                  <td>{cuenta.banco}</td>
                  <td>{TIPO_CUENTA_BANCARIA_LABELS[cuenta.tipoCuenta]}</td>
                  <td>{cuenta.numero}</td>
                  <td>{cuenta.titular}</td>
                  <td>{cuenta.rut}</td>
                  <td>{cuenta.email ?? ''}</td>
                  <td>
                    <div className="table__actions">
                      <button
                        type="button"
                        className="icon-button"
                        title="Editar"
                        aria-label="Editar"
                        onClick={() => abrirEdicion(cuenta)}
                      >
                        <IconEditar />
                      </button>
                      <button
                        type="button"
                        className="icon-button icon-button--danger"
                        title="Eliminar"
                        aria-label="Eliminar"
                        onClick={() => eliminar.pedir(cuenta.id)}
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

      {showForm && (
        <Modal titulo={editingId ? 'Editar cuenta bancaria' : 'Nueva cuenta bancaria'} onClose={cerrarForm}>
          <form className="inline-form" onSubmit={handleSubmit}>
            <div className="inline-form__grid">
              <label>
                Alias
                <input
                  required
                  value={form.alias}
                  onChange={(e) => setForm({ ...form, alias: e.target.value })}
                  placeholder="Ej. Cuenta principal"
                />
              </label>
              <label>
                Banco
                <input
                  required
                  value={form.banco}
                  onChange={(e) => setForm({ ...form, banco: e.target.value })}
                />
              </label>
              <label>
                Tipo de cuenta
                <select
                  value={form.tipoCuenta}
                  onChange={(e) =>
                    setForm({ ...form, tipoCuenta: e.target.value as TipoCuentaBancaria })
                  }
                >
                  {TIPOS_CUENTA.map((tipo) => (
                    <option key={tipo} value={tipo}>
                      {TIPO_CUENTA_BANCARIA_LABELS[tipo]}
                    </option>
                  ))}
                </select>
              </label>
              <label>
                Número de cuenta
                <input
                  required
                  value={form.numero}
                  onChange={(e) => setForm({ ...form, numero: e.target.value })}
                />
              </label>
              <label>
                Titular
                <input
                  required
                  value={form.titular}
                  onChange={(e) => setForm({ ...form, titular: e.target.value })}
                />
              </label>
              <label>
                RUT
                <input
                  required
                  value={form.rut}
                  onChange={(e) => setForm({ ...form, rut: e.target.value })}
                />
              </label>
              <label>
                Email para comprobante (opcional)
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                />
              </label>
            </div>

            {error && <p className="auth-card__error">{error}</p>}

            <button type="submit" disabled={saving}>
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
          </form>
        </Modal>
      )}

      {eliminar.modal}
    </div>
  );
}
