import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { ArriendoPropiedad, EstadoPago, Pago } from '../api/types';
import { ddmmyyyyToIso, formatFecha } from '../lib/format';
import { DateInput } from '../components/DateInput';

const PAGO_FORM_INICIAL = {
  periodo: '',
  fechaComprometida: '',
  monto: '',
  medioPago: '',
};

function formatMonto(monto: string | number) {
  return new Intl.NumberFormat('es-CL', { style: 'currency', currency: 'CLP' }).format(
    Number(monto),
  );
}

interface BloqueArriendoProps {
  arriendo: ArriendoPropiedad;
}

function BloqueArriendo({ arriendo }: BloqueArriendoProps) {
  const [pagos, setPagos] = useState<Pago[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(PAGO_FORM_INICIAL);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const cargar = () => {
    setLoading(true);
    api
      .get<Pago[]>(`/pagos?arriendoTipo=propiedad&arriendoId=${arriendo.id}`)
      .then(setPagos)
      .finally(() => setLoading(false));
  };

  useEffect(cargar, [arriendo.id]);

  const pagosOrdenados = [...pagos].sort((a, b) => b.periodo.localeCompare(a.periodo));
  const ultimoPago = pagosOrdenados.find((p) => p.estado === 'PAGADO') ?? pagosOrdenados[0];
  const totalAbonado = pagos
    .filter((p) => p.estado === 'PAGADO')
    .reduce((acc, p) => acc + Number(p.monto), 0);
  const totalPendiente = pagos
    .filter((p) => p.estado === 'PENDIENTE' || p.estado === 'ATRASADO')
    .reduce((acc, p) => acc + Number(p.monto), 0);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const periodo = ddmmyyyyToIso(form.periodo);
    const fechaComprometida = ddmmyyyyToIso(form.fechaComprometida);
    if (!periodo || !fechaComprometida) {
      setError('Revisa las fechas, deben tener el formato dd/mm/aaaa.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/pagos', {
        arriendoTipo: 'propiedad',
        arriendoId: arriendo.id,
        periodo,
        fechaComprometida,
        monto: Number(form.monto),
        medioPago: form.medioPago || undefined,
      });
      setForm(PAGO_FORM_INICIAL);
      setShowForm(false);
      cargar();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo registrar el pago');
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="detail-card pagos-arrendatario__bloque">
      <h2>
        <Link to={`/arriendos/${arriendo.id}`}>
          {arriendo.propiedad.calle} {arriendo.propiedad.numero}
        </Link>
      </h2>

      {loading ? (
        <p>Cargando…</p>
      ) : (
        <>
          <div className="stat-grid">
            <div className="stat-card">
              <span className="stat-card__label">Último pago</span>
              <span className="stat-card__value">
                {ultimoPago ? formatMonto(ultimoPago.monto) : '—'}
              </span>
              <span className="stat-card__count">
                {ultimoPago
                  ? `${formatFecha(ultimoPago.periodo)} · ${ultimoPago.estado}`
                  : 'Sin pagos aún'}
              </span>
            </div>
            <div className="stat-card stat-card--pagado">
              <span className="stat-card__label">Total abonado</span>
              <span className="stat-card__value">{formatMonto(totalAbonado)}</span>
            </div>
            <div className="stat-card stat-card--pendiente">
              <span className="stat-card__label">Saldo pendiente</span>
              <span className="stat-card__value">{formatMonto(totalPendiente)}</span>
            </div>
          </div>

          <div className="page-header">
            <span />
            <button type="button" onClick={() => setShowForm((v) => !v)}>
              {showForm ? 'Cancelar' : '+ Registrar pago'}
            </button>
          </div>

          {showForm && (
            <form className="inline-form" onSubmit={handleSubmit}>
              <div className="inline-form__grid">
                <label>
                  Periodo
                  <DateInput
                    value={form.periodo}
                    onChange={(value) => setForm({ ...form, periodo: value })}
                    required
                  />
                </label>
                <label>
                  Fecha comprometida
                  <DateInput
                    value={form.fechaComprometida}
                    onChange={(value) => setForm({ ...form, fechaComprometida: value })}
                    required
                  />
                </label>
                <label>
                  Monto
                  <input
                    type="number"
                    min={0}
                    required
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  />
                </label>
                <label>
                  Medio de pago
                  <input
                    placeholder="ej. Transferencia"
                    value={form.medioPago}
                    onChange={(e) => setForm({ ...form, medioPago: e.target.value })}
                  />
                </label>
              </div>

              {error && <p className="auth-card__error">{error}</p>}

              <button type="submit" disabled={saving}>
                {saving ? 'Guardando…' : 'Registrar'}
              </button>
            </form>
          )}

          {pagosOrdenados.length === 0 && <p className="empty-state">Sin pagos registrados.</p>}
          {pagosOrdenados.length > 0 && (
            <div className="table-wrap">
              <table className="table">
                <thead>
                  <tr>
                    <th>Periodo</th>
                    <th>Comprometido</th>
                    <th>Monto</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosOrdenados.map((pago) => (
                    <tr key={pago.id}>
                      <td>{formatFecha(pago.periodo)}</td>
                      <td>{formatFecha(pago.fechaComprometida)}</td>
                      <td>{formatMonto(pago.monto)}</td>
                      <td>
                        <span className={`badge badge--${pago.estado.toLowerCase()}`}>
                          {pago.estado as EstadoPago}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </>
      )}
    </section>
  );
}

export function PagosArrendatarioPage() {
  const [arriendos, setArriendos] = useState<ArriendoPropiedad[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get<ArriendoPropiedad[]>('/arriendos-propiedad')
      .then(setArriendos)
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      <h1>Mis pagos</h1>

      {loading && <p>Cargando…</p>}
      {!loading && arriendos.length === 0 && (
        <p className="empty-state">No tienes arriendos asociados.</p>
      )}

      {arriendos.map((arriendo) => (
        <BloqueArriendo key={arriendo.id} arriendo={arriendo} />
      ))}
    </div>
  );
}
