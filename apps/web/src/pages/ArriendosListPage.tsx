import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api/client';
import { useAuth } from '../auth/AuthContext';
import type {
  ArriendoPropiedad,
  CategoriaPago,
  EstadoArriendo,
  Pago,
  Persona,
  Propiedad,
  Requerimiento,
} from '../api/types';
import { ddmmyyyyToIso, formatFecha, formatMonto } from '../lib/format';
import { DateInput } from '../components/DateInput';
import { Modal } from '../components/Modal';
import { calcularProximaAlza, ESTADO_ALZA_LABELS } from '../lib/alzas';
import { periodoValorAFecha } from '../lib/periodos';

const REQUERIMIENTO_ESTADOS_ABIERTOS = [
  'PENDIENTE_REVISION',
  'REVISION_AGENDADA',
  'EN_REVISION',
  'REABIERTO',
];

interface EstadoMesActual {
  claseBadge: string;
  label: string;
}

const ESTADO_PAGO_LABELS: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  PAGADO: 'Pagado',
  ATRASADO: 'Atrasado',
  RECHAZADO: 'Rechazado',
};

/**
 * Estado del pago del mes actual de una categoría (arriendo o servicios
 * básicos), para mostrar en su propia columna en la tabla — la etiqueta ya
 * no repite el nombre de la categoría porque el encabezado de la columna la
 * identifica.
 */
function calcularEstadoMesActual(
  arriendo: ArriendoPropiedad,
  pagos: Pago[],
  categoria: CategoriaPago,
): EstadoMesActual | null {
  if (arriendo.estado !== 'ACTIVO') return null;

  const hoy = new Date();
  const mesActual = `${hoy.getFullYear()}-${String(hoy.getMonth() + 1).padStart(2, '0')}`;
  const pagosDelMes = pagos.filter(
    (p) =>
      p.arriendoTipo === 'propiedad' &&
      p.arriendoId === arriendo.id &&
      p.categoria === categoria &&
      p.fechaComprometida.slice(0, 7) === mesActual,
  );

  const pagoCompleto = pagosDelMes.find((p) => p.estado !== 'RECHAZADO' && !p.esAbono);
  if (pagoCompleto) {
    return {
      claseBadge: pagoCompleto.estado.toLowerCase(),
      label: ESTADO_PAGO_LABELS[pagoCompleto.estado],
    };
  }

  const tieneAbono = pagosDelMes.some((p) => p.estado !== 'RECHAZADO' && p.esAbono);
  if (tieneAbono) {
    return { claseBadge: 'abono', label: 'Abono recibido este mes' };
  }

  const fechaVencimiento = periodoValorAFecha(mesActual, arriendo.fechaPago);
  const hoyIso = hoy.toISOString().slice(0, 10);
  if (hoyIso > fechaVencimiento) {
    return { claseBadge: 'atrasado', label: 'Sin registrar' };
  }
  return { claseBadge: 'pendiente', label: 'Pendiente de registrar' };
}

const PERIODOS_ALZA = ['MENSUAL', 'TRIMESTRAL', 'SEMESTRAL', 'ANUAL', 'SIN REAJUSTE'] as const;

const ESTADOS: Array<{ value: EstadoArriendo | ''; label: string }> = [
  { value: '', label: 'Todos' },
  { value: 'ACTIVO', label: 'Activos' },
  { value: 'INACTIVO', label: 'Inactivos' },
  { value: 'TERMINADO', label: 'Terminados' },
];

const FORM_INICIAL = {
  propiedadId: '',
  arrendatarioId: '',
  codeudorId: '',
  fechaPago: '',
  fechaEntrega: '',
  periodoAlza: 'ANUAL',
  montoArriendo: '',
  garantia: false,
  garantiaMontoPactado: '',
};

export function ArriendosListPage() {
  const { rol } = useAuth();
  const esStaff = rol !== 'ARRENDATARIO';
  const navigate = useNavigate();

  const [arriendos, setArriendos] = useState<ArriendoPropiedad[]>([]);
  const [estado, setEstado] = useState<EstadoArriendo | ''>('ACTIVO');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [propiedades, setPropiedades] = useState<Propiedad[]>([]);
  const [personas, setPersonas] = useState<Persona[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState(FORM_INICIAL);
  const [formError, setFormError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [pagos, setPagos] = useState<Pago[]>([]);
  const [requerimientos, setRequerimientos] = useState<Requerimiento[]>([]);

  const cargar = () => {
    setLoading(true);
    setError(null);
    const query = estado ? `?estado=${estado}` : '';
    api
      .get<ArriendoPropiedad[]>(`/arriendos-propiedad${query}`)
      .then(setArriendos)
      .catch(() => setError('No se pudieron cargar los arriendos'))
      .finally(() => setLoading(false));
  };

  useEffect(cargar, [estado]);
  useEffect(() => {
    if (!esStaff) return;
    api.get<Propiedad[]>('/propiedades').then(setPropiedades);
    api.get<Persona[]>('/personas').then(setPersonas);
    api.get<Pago[]>('/pagos').then(setPagos);
    api.get<Requerimiento[]>('/requerimientos').then(setRequerimientos);
  }, [esStaff]);

  useEffect(() => {
    if (esStaff) return;
    api.get<ArriendoPropiedad[]>('/arriendos-propiedad').then((todos) => {
      if (todos.length === 1) {
        navigate(`/arriendos/${todos[0].id}`, { replace: true });
      }
    });
  }, [esStaff, navigate]);

  const cerrarForm = () => {
    setShowForm(false);
    setForm(FORM_INICIAL);
    setFormError(null);
  };

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setFormError(null);

    const fechaEntrega = ddmmyyyyToIso(form.fechaEntrega);
    if (!fechaEntrega) {
      setFormError('Fecha de entrega inválida, usa el formato dd/mm/aaaa.');
      return;
    }

    setSaving(true);
    try {
      await api.post('/arriendos-propiedad', {
        propiedadId: form.propiedadId,
        arrendatarioId: form.arrendatarioId,
        codeudorId: form.codeudorId || undefined,
        fechaPago: Number(form.fechaPago),
        fechaEntrega,
        periodoAlza: form.periodoAlza,
        montoArriendo: Number(form.montoArriendo),
        garantia: form.garantia,
        garantiaMontoPactado: form.garantia && form.garantiaMontoPactado
          ? Number(form.garantiaMontoPactado)
          : undefined,
      });
      cerrarForm();
      cargar();
    } catch (err) {
      setFormError(err instanceof ApiError ? err.message : 'No se pudo crear el arriendo');
    } finally {
      setSaving(false);
    }
  };

  const arriendosConAlzaPendiente = esStaff
    ? arriendos.filter((a) => {
        if (a.estado !== 'ACTIVO') return false;
        const alza = calcularProximaAlza(a.fechaEntrega, a.periodoAlza);
        return alza !== null && (alza.estado === 'vencido' || alza.estado === 'proximo');
      })
    : [];

  return (
    <div>
      <div className="page-header">
        <h1>Arriendos</h1>
        <div className="page-header__actions">
          <select value={estado} onChange={(e) => setEstado(e.target.value as EstadoArriendo | '')}>
            {ESTADOS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
          {esStaff && (
            <button type="button" onClick={() => setShowForm(true)}>
              + Nuevo arriendo
            </button>
          )}
        </div>
      </div>

      {esStaff && showForm && (
        <Modal titulo="Nuevo arriendo" onClose={cerrarForm}>
        <form className="inline-form" onSubmit={handleSubmit}>
          <div className="inline-form__grid">
            <label>
              Propiedad
              <select
                required
                value={form.propiedadId}
                onChange={(e) => setForm({ ...form, propiedadId: e.target.value })}
              >
                <option value="">Elige una propiedad…</option>
                {propiedades.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.calle} {p.numero}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Arrendatario
              <select
                required
                value={form.arrendatarioId}
                onChange={(e) => setForm({ ...form, arrendatarioId: e.target.value })}
              >
                <option value="">Elige una persona…</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreCompleto}
                    {p.rut ? ` (${p.rut})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Codeudor (opcional)
              <select
                value={form.codeudorId}
                onChange={(e) => setForm({ ...form, codeudorId: e.target.value })}
              >
                <option value="">Sin codeudor</option>
                {personas.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.nombreCompleto}
                    {p.rut ? ` (${p.rut})` : ''}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Día de pago (1-31)
              <input
                type="number"
                min={1}
                max={31}
                required
                value={form.fechaPago}
                onChange={(e) => setForm({ ...form, fechaPago: e.target.value })}
              />
            </label>
            <label>
              Fecha de entrega
              <DateInput
                value={form.fechaEntrega}
                onChange={(value) => setForm({ ...form, fechaEntrega: value })}
                required
              />
            </label>
            <label>
              Periodo de reajuste
              <select
                required
                value={form.periodoAlza}
                onChange={(e) => setForm({ ...form, periodoAlza: e.target.value })}
              >
                {PERIODOS_ALZA.map((periodo) => (
                  <option key={periodo} value={periodo}>
                    {periodo}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Monto arriendo
              <input
                type="number"
                min={0}
                required
                value={form.montoArriendo}
                onChange={(e) => setForm({ ...form, montoArriendo: e.target.value })}
              />
            </label>
          </div>

          <div className="inline-form__checks">
            <label className="checkbox">
              <input
                type="checkbox"
                checked={form.garantia}
                onChange={(e) => setForm({ ...form, garantia: e.target.checked })}
              />
              Con garantía
            </label>
          </div>

          {form.garantia && (
            <label>
              Monto garantía pactado
              <input
                type="number"
                min={0}
                value={form.garantiaMontoPactado}
                onChange={(e) => setForm({ ...form, garantiaMontoPactado: e.target.value })}
              />
            </label>
          )}

          {formError && <p className="auth-card__error">{formError}</p>}

          <button type="submit" disabled={saving}>
            {saving ? 'Guardando…' : 'Guardar arriendo'}
          </button>
        </form>
        </Modal>
      )}

      {loading && <p>Cargando…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && arriendos.length === 0 && (
        <p className="empty-state">No hay arriendos {estado ? estado.toLowerCase() : ''}.</p>
      )}

      {esStaff && arriendosConAlzaPendiente.length > 0 && (
        <div className="alza-banner">
          <span>
            {arriendosConAlzaPendiente.length} arriendo
            {arriendosConAlzaPendiente.length > 1 ? 's' : ''} con reajuste atrasado o próximo
          </span>
        </div>
      )}

      <div className="table-wrap">
        <table className="table">
          <thead>
            <tr>
              <th>Propiedad</th>
              <th>Arrendatario</th>
              <th>Estado</th>
              <th>Monto</th>
              {esStaff && <th>Arriendo</th>}
              {esStaff && <th>Servicios básicos</th>}
              {esStaff && <th>Requerimientos</th>}
              {esStaff && <th>Reajuste</th>}
            </tr>
          </thead>
          <tbody>
            {arriendos.map((arriendo) => {
              const alza =
                esStaff && arriendo.estado === 'ACTIVO'
                  ? calcularProximaAlza(arriendo.fechaEntrega, arriendo.periodoAlza)
                  : null;
              const alzaVisible =
                alza && (alza.estado === 'vencido' || alza.estado === 'proximo') ? alza : null;
              const estadoArriendo = esStaff
                ? calcularEstadoMesActual(arriendo, pagos, 'ARRIENDO')
                : null;
              const estadoServicios = esStaff
                ? calcularEstadoMesActual(arriendo, pagos, 'SERVICIOS_BASICOS')
                : null;
              const requerimientosAbiertos = esStaff
                ? requerimientos.filter(
                    (r) =>
                      r.arriendoPropiedadId === arriendo.id &&
                      REQUERIMIENTO_ESTADOS_ABIERTOS.includes(r.estado),
                  ).length
                : 0;

              return (
                <tr key={arriendo.id}>
                  <td>
                    <Link to={`/arriendos/${arriendo.id}`}>
                      {arriendo.propiedad.calle} {arriendo.propiedad.numero}
                    </Link>
                  </td>
                  <td>{arriendo.arrendatario.nombreCompleto}</td>
                  <td>
                    <span className={`badge badge--${arriendo.estado.toLowerCase()}`}>
                      {arriendo.estado}
                    </span>
                  </td>
                  <td>{formatMonto(arriendo.montoArriendo)}/mes</td>
                  {esStaff && (
                    <td>
                      <Link to={`/arriendos/${arriendo.id}#pagos-arriendo`}>
                        {estadoArriendo ? (
                          <span className={`badge badge--${estadoArriendo.claseBadge}`}>
                            {estadoArriendo.label}
                          </span>
                        ) : (
                          '—'
                        )}
                      </Link>
                    </td>
                  )}
                  {esStaff && (
                    <td>
                      <Link to={`/arriendos/${arriendo.id}#pagos-servicios`}>
                        {estadoServicios ? (
                          <span className={`badge badge--${estadoServicios.claseBadge}`}>
                            {estadoServicios.label}
                          </span>
                        ) : (
                          '—'
                        )}
                      </Link>
                    </td>
                  )}
                  {esStaff && (
                    <td>
                      {requerimientosAbiertos > 0 ? (
                        <span className="badge badge--pendiente_revision">
                          {requerimientosAbiertos} en curso
                        </span>
                      ) : (
                        <span className="empty-state">Sin pendientes</span>
                      )}
                    </td>
                  )}
                  {esStaff && (
                    <td>
                      {alzaVisible ? (
                        <span className={`badge badge--${alzaVisible.estado}`}>
                          {ESTADO_ALZA_LABELS[alzaVisible.estado]} ·{' '}
                          {formatFecha(alzaVisible.fechaIso)}
                        </span>
                      ) : (
                        '—'
                      )}
                    </td>
                  )}
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
