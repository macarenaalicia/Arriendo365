import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import type { ArriendoPropiedad, EstadoPago, Pago } from '../api/types';
import { ddmmyyyyToIso, formatFecha, hoyDdmmyyyy } from '../lib/format';
import { DateInput } from '../components/DateInput';
import {
  MEDIOS_PAGO,
  generarOpcionesPeriodo,
  periodoValorAFecha,
  type OpcionPeriodo,
} from '../lib/periodos';

const PAGO_FORM_INICIAL = {
  periodo: '',
  periodoPago: '',
  monto: '',
  medioPago: '',
  tipoPago: 'completo' as 'completo' | 'abono',
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
  const [opcionesPeriodo, setOpcionesPeriodo] = useState<OpcionPeriodo[]>([]);
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

  const abrirFormulario = () => {
    const { opciones, proximoValue } = generarOpcionesPeriodo(pagos);
    setOpcionesPeriodo(opciones);
    setForm({
      ...PAGO_FORM_INICIAL,
      periodo: hoyDdmmyyyy(),
      periodoPago: proximoValue,
      monto: arriendo.montoArriendo,
    });
    setShowForm(true);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);

    const periodo = ddmmyyyyToIso(form.periodo);
    if (!periodo) {
      setError('La fecha de pago debe tener el formato dd/mm/aaaa.');
      return;
    }
    if (!form.periodoPago) {
      setError('Elige el periodo de pago.');
      return;
    }
    if (!form.medioPago) {
      setError('Elige el medio de pago.');
      return;
    }

    const fechaComprometida = periodoValorAFecha(form.periodoPago, arriendo.fechaPago);

    setSaving(true);
    try {
      await api.post('/pagos', {
        arriendoTipo: 'propiedad',
        arriendoId: arriendo.id,
        periodo,
        fechaComprometida,
        monto: Number(form.monto),
        medioPago: form.medioPago,
        esAbono: form.tipoPago === 'abono',
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
                  ? `${formatFecha(ultimoPago.periodo)} · ${ultimoPago.estado}${
                      ultimoPago.esAbono ? ' · Abono' : ''
                    }`
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
            <button
              type="button"
              onClick={() => (showForm ? setShowForm(false) : abrirFormulario())}
            >
              {showForm ? 'Cancelar' : '+ Registrar pago'}
            </button>
          </div>

          {showForm && (
            <form className="inline-form" onSubmit={handleSubmit}>
              <div className="inline-form__grid">
                <label>
                  Fecha de pago
                  <DateInput
                    value={form.periodo}
                    onChange={(value) => setForm({ ...form, periodo: value })}
                    required
                  />
                </label>
                <label>
                  Periodo de pago
                  <select
                    required
                    value={form.periodoPago}
                    onChange={(e) => setForm({ ...form, periodoPago: e.target.value })}
                  >
                    {opcionesPeriodo.map((o) => (
                      <option key={o.value} value={o.value}>
                        {o.label}
                      </option>
                    ))}
                  </select>
                </label>
                <label>
                  Tipo de pago
                  <select
                    value={form.tipoPago}
                    onChange={(e) => {
                      const tipoPago = e.target.value as 'completo' | 'abono';
                      setForm({
                        ...form,
                        tipoPago,
                        monto: tipoPago === 'completo' ? arriendo.montoArriendo : form.monto,
                      });
                    }}
                  >
                    <option value="completo">Pago completo</option>
                    <option value="abono">Abono</option>
                  </select>
                </label>
                <label>
                  Monto
                  <input
                    type="number"
                    min={0}
                    required
                    disabled={form.tipoPago === 'completo'}
                    value={form.monto}
                    onChange={(e) => setForm({ ...form, monto: e.target.value })}
                  />
                </label>
                <label>
                  Medio de pago
                  <select
                    required
                    value={form.medioPago}
                    onChange={(e) => setForm({ ...form, medioPago: e.target.value })}
                  >
                    <option value="">Selecciona…</option>
                    {MEDIOS_PAGO.map((medio) => (
                      <option key={medio} value={medio}>
                        {medio}
                      </option>
                    ))}
                  </select>
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
                    <th>Fecha de pago</th>
                    <th>Periodo de pago</th>
                    <th>Monto</th>
                    <th>Tipo</th>
                    <th>Estado</th>
                  </tr>
                </thead>
                <tbody>
                  {pagosOrdenados.map((pago) => (
                    <tr key={pago.id}>
                      <td>{formatFecha(pago.periodo)}</td>
                      <td>{formatFecha(pago.fechaComprometida)}</td>
                      <td>{formatMonto(pago.monto)}</td>
                      <td>{pago.esAbono ? 'Abono' : 'Completo'}</td>
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
