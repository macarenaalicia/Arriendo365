import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { ArriendoPropiedad, EstadoPago, Pago } from '../api/types';
import { ddmmyyyyToIso, formatFecha, isoToDdmmyyyy } from '../lib/format';
import { DateInput } from '../components/DateInput';

const ESTADOS_PAGO: EstadoPago[] = ['PENDIENTE', 'PAGADO', 'ATRASADO', 'RECHAZADO'];

const PAGO_FORM_INICIAL = {
  periodo: '',
  fechaComprometida: '',
  monto: '',
  medioPago: '',
  estado: 'PENDIENTE' as EstadoPago,
};

function formatMonto(monto: string | number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
    Number(monto),
  );
}

export function ArriendoDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [arriendo, setArriendo] = useState<ArriendoPropiedad | null>(null);
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [showPagoForm, setShowPagoForm] = useState(false);
  const [editingPagoId, setEditingPagoId] = useState<string | null>(null);
  const [pagoForm, setPagoForm] = useState(PAGO_FORM_INICIAL);
  const [pagoError, setPagoError] = useState<string | null>(null);
  const [savingPago, setSavingPago] = useState(false);

  const cargarPagos = () => {
    if (!id) return;
    api.get<Pago[]>(`/pagos?arriendoTipo=propiedad&arriendoId=${id}`).then(setPagos);
  };

  useEffect(() => {
    if (!id) return;
    setLoading(true);
    setError(null);

    Promise.all([
      api.get<ArriendoPropiedad>(`/arriendos-propiedad/${id}`),
      api.get<Pago[]>(`/pagos?arriendoTipo=propiedad&arriendoId=${id}`),
    ])
      .then(([arriendoData, pagosData]) => {
        setArriendo(arriendoData);
        setPagos(pagosData);
      })
      .catch(() => setError('No se pudo cargar el detalle del arriendo'))
      .finally(() => setLoading(false));
  }, [id]);

  const cerrarPagoForm = () => {
    setShowPagoForm(false);
    setEditingPagoId(null);
    setPagoForm(PAGO_FORM_INICIAL);
    setPagoError(null);
  };

  const abrirCreacionPago = () => {
    setPagoForm(PAGO_FORM_INICIAL);
    setEditingPagoId(null);
    setShowPagoForm(true);
  };

  const abrirEdicionPago = (pago: Pago) => {
    setPagoForm({
      periodo: isoToDdmmyyyy(pago.periodo),
      fechaComprometida: isoToDdmmyyyy(pago.fechaComprometida),
      monto: pago.monto,
      medioPago: pago.medioPago ?? '',
      estado: pago.estado,
    });
    setEditingPagoId(pago.id);
    setShowPagoForm(true);
  };

  const handleSubmitPago = async (event: React.FormEvent) => {
    event.preventDefault();
    setPagoError(null);

    const periodo = ddmmyyyyToIso(pagoForm.periodo);
    const fechaComprometida = ddmmyyyyToIso(pagoForm.fechaComprometida);
    if (!periodo || !fechaComprometida) {
      setPagoError('Revisa las fechas, deben tener el formato dd/mm/aaaa.');
      return;
    }

    setSavingPago(true);
    try {
      const payload = {
        arriendoTipo: 'propiedad',
        arriendoId: id,
        periodo,
        fechaComprometida,
        monto: Number(pagoForm.monto),
        medioPago: pagoForm.medioPago || undefined,
        estado: pagoForm.estado,
      };

      if (editingPagoId) {
        await api.patch(`/pagos/${editingPagoId}`, payload);
      } else {
        await api.post('/pagos', payload);
      }

      cerrarPagoForm();
      cargarPagos();
    } catch (err) {
      setPagoError(err instanceof ApiError ? err.message : 'No se pudo guardar el pago');
    } finally {
      setSavingPago(false);
    }
  };

  const handleDeletePago = async (pagoId: string) => {
    if (!confirm('¿Eliminar este pago?')) return;
    await api.delete(`/pagos/${pagoId}`);
    if (editingPagoId === pagoId) cerrarPagoForm();
    setPagos((prev) => prev.filter((p) => p.id !== pagoId));
  };

  if (loading) return <p>Cargando…</p>;
  if (error) return <p className="error-text">{error}</p>;
  if (!arriendo) return null;

  return (
    <div>
      <Link to="/" className="back-link">
        ← Volver a arriendos
      </Link>

      <div className="page-header">
        <h1>
          {arriendo.propiedad.calle} {arriendo.propiedad.numero}
        </h1>
        <span className={`badge badge--${arriendo.estado.toLowerCase()}`}>{arriendo.estado}</span>
      </div>

      <section className="detail-grid">
        <div className="detail-card">
          <h2>Propiedad</h2>
          <p>
            {arriendo.propiedad.calle} {arriendo.propiedad.numero}, {arriendo.propiedad.ciudad}
          </p>
          <p>
            {arriendo.propiedad.tipo} · {arriendo.propiedad.nHabitaciones} hab ·{' '}
            {arriendo.propiedad.nBanos} baños
          </p>
        </div>

        <div className="detail-card">
          <h2>Arrendatario</h2>
          <p>{arriendo.arrendatario.nombreCompleto}</p>
          <p>{arriendo.arrendatario.rut}</p>
          {arriendo.arrendatario.email && <p>{arriendo.arrendatario.email}</p>}
        </div>

        <div className="detail-card">
          <h2>Condiciones</h2>
          <p>Monto: {formatMonto(arriendo.montoArriendo)}</p>
          <p>Día de pago: {arriendo.fechaPago}</p>
          <p>Entrega: {formatFecha(arriendo.fechaEntrega)}</p>
          <p>Reajuste: {arriendo.periodoAlza}</p>
        </div>
      </section>

      <section>
        <div className="page-header">
          <h2>Pagos</h2>
          <button type="button" onClick={showPagoForm ? cerrarPagoForm : abrirCreacionPago}>
            {showPagoForm ? 'Cancelar' : '+ Registrar pago'}
          </button>
        </div>

        {showPagoForm && (
          <form className="inline-form" onSubmit={handleSubmitPago}>
            <div className="inline-form__grid">
              <label>
                Periodo
                <DateInput
                  value={pagoForm.periodo}
                  onChange={(value) => setPagoForm({ ...pagoForm, periodo: value })}
                  required
                />
              </label>
              <label>
                Fecha comprometida
                <DateInput
                  value={pagoForm.fechaComprometida}
                  onChange={(value) => setPagoForm({ ...pagoForm, fechaComprometida: value })}
                  required
                />
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
                <input
                  placeholder="ej. Transferencia"
                  value={pagoForm.medioPago}
                  onChange={(e) => setPagoForm({ ...pagoForm, medioPago: e.target.value })}
                />
              </label>
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
            </div>

            {pagoError && <p className="auth-card__error">{pagoError}</p>}

            <button type="submit" disabled={savingPago}>
              {savingPago ? 'Guardando…' : editingPagoId ? 'Guardar cambios' : 'Guardar pago'}
            </button>
          </form>
        )}

        {pagos.length === 0 && <p className="empty-state">Sin pagos registrados.</p>}
        {pagos.length > 0 && (
          <div className="table-wrap">
            <table className="table">
              <thead>
                <tr>
                  <th>Periodo</th>
                  <th>Comprometido</th>
                  <th>Monto</th>
                  <th>Estado</th>
                  <th>Acciones</th>
                </tr>
              </thead>
              <tbody>
                {pagos.map((pago) => (
                  <tr key={pago.id}>
                    <td>{formatFecha(pago.periodo)}</td>
                    <td>{formatFecha(pago.fechaComprometida)}</td>
                    <td>{formatMonto(pago.monto)}</td>
                    <td>
                      <span className={`badge badge--${pago.estado.toLowerCase()}`}>
                        {pago.estado}
                      </span>
                    </td>
                    <td>
                      <div className="table__actions">
                        <button type="button" onClick={() => abrirEdicionPago(pago)}>
                          Editar
                        </button>
                        <button
                          type="button"
                          className="danger"
                          onClick={() => handleDeletePago(pago.id)}
                        >
                          Eliminar
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
    </div>
  );
}
