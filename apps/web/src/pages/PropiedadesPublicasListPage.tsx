import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { api } from '../api/client';
import type { PropiedadPublica } from '../api/types';
import { formatMonto } from '../lib/format';

const TIPO_LABELS: Record<string, string> = {
  CASA: 'Casa',
  DEPARTAMENTO: 'Departamento',
  HABITACION: 'Habitación',
  TERRENO: 'Terreno',
};

export function PropiedadesPublicasListPage() {
  const { organizacionId = '' } = useParams();
  const [propiedades, setPropiedades] = useState<PropiedadPublica[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<PropiedadPublica[]>(`/public/organizaciones/${organizacionId}/propiedades`)
      .then(setPropiedades)
      .catch(() => setError('No se pudo cargar el listado de propiedades.'))
      .finally(() => setLoading(false));
  }, [organizacionId]);

  return (
    <div className="public-page">
      <header className="public-page__header">
        <h1>Propiedades disponibles</h1>
        <p>Arriendos publicados y listos para visitar.</p>
      </header>

      {loading && <p>Cargando…</p>}
      {error && <p className="error-text">{error}</p>}

      {!loading && !error && propiedades.length === 0 && (
        <p className="empty-state">No hay propiedades disponibles por el momento.</p>
      )}

      <div className="public-grid">
        {propiedades.map((propiedad) => (
          <Link
            key={propiedad.id}
            to={`/publico/${organizacionId}/propiedades/${propiedad.id}`}
            className="public-card"
          >
            <div className="public-card__foto">
              {propiedad.fotos[0] ? (
                <img src={propiedad.fotos[0].archivoUrl} alt={propiedad.calle} />
              ) : (
                <span className="public-card__foto-vacia">Sin fotos</span>
              )}
            </div>
            <div className="public-card__body">
              <span className="badge">{TIPO_LABELS[propiedad.tipo] ?? propiedad.tipo}</span>
              <h2>
                {propiedad.calle} {propiedad.numero}
              </h2>
              <p className="public-card__ubicacion">
                {propiedad.sector ? `${propiedad.sector}, ` : ''}
                {propiedad.ciudad}, {propiedad.region}
              </p>
              <p className="public-card__caracteristicas">
                {propiedad.nHabitaciones} dorm. · {propiedad.nBanos} baños ·{' '}
                {propiedad.mt2Construidos} m² construidos
              </p>
              {propiedad.precioArriendoEsperado && (
                <p className="public-card__precio">{formatMonto(propiedad.precioArriendoEsperado)} / mes</p>
              )}
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
}
