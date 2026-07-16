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

export function PropiedadPublicaDetailPage() {
  const { organizacionId = '', id = '' } = useParams();
  const [propiedad, setPropiedad] = useState<PropiedadPublica | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setLoading(true);
    setError(null);
    api
      .get<PropiedadPublica>(`/public/organizaciones/${organizacionId}/propiedades/${id}`)
      .then(setPropiedad)
      .catch(() => setError('Esta propiedad ya no está disponible.'))
      .finally(() => setLoading(false));
  }, [organizacionId, id]);

  if (loading) return <p className="public-page">Cargando…</p>;

  if (error || !propiedad) {
    return (
      <div className="public-page">
        <Link to={`/publico/${organizacionId}/propiedades`} className="back-link">
          ← Volver al listado
        </Link>
        <p className="error-text">{error ?? 'Propiedad no encontrada.'}</p>
      </div>
    );
  }

  return (
    <div className="public-page">
      <Link to={`/publico/${organizacionId}/propiedades`} className="back-link">
        ← Volver al listado
      </Link>

      {propiedad.fotos.length > 0 && (
        <div className="public-gallery">
          {propiedad.fotos.map((foto) => (
            <img key={foto.id} src={foto.archivoUrl} alt={foto.descripcion ?? propiedad.calle} />
          ))}
        </div>
      )}

      <div className="page-header">
        <h1>
          {propiedad.calle} {propiedad.numero}
          {propiedad.numeroDepartamento ? ` depto ${propiedad.numeroDepartamento}` : ''}
        </h1>
        <span className="badge">{TIPO_LABELS[propiedad.tipo] ?? propiedad.tipo}</span>
      </div>

      <p className="public-card__ubicacion public-card__ubicacion--detalle">
        {[propiedad.sector, propiedad.ciudad, propiedad.region].filter(Boolean).join(' · ')}
      </p>

      {propiedad.precioArriendoEsperado && (
        <p className="public-card__precio public-card__precio--grande">
          {formatMonto(propiedad.precioArriendoEsperado)} / mes
        </p>
      )}

      <section className="detail-grid">
        <div className="detail-card">
          <h2>Características</h2>
          <div className="detail-card__grid">
            <div className="detail-card__item">
              <span className="detail-card__label">Dormitorios</span>
              <span className="detail-card__value">{propiedad.nHabitaciones}</span>
            </div>
            <div className="detail-card__item">
              <span className="detail-card__label">Baños</span>
              <span className="detail-card__value">{propiedad.nBanos}</span>
            </div>
            <div className="detail-card__item">
              <span className="detail-card__label">M² totales</span>
              <span className="detail-card__value">{propiedad.mt2Totales}</span>
            </div>
            <div className="detail-card__item">
              <span className="detail-card__label">M² construidos</span>
              <span className="detail-card__value">{propiedad.mt2Construidos}</span>
            </div>
            <div className="detail-card__item">
              <span className="detail-card__label">Bodega</span>
              <span className="detail-card__value">{propiedad.bodega ? 'Sí' : 'No'}</span>
            </div>
            <div className="detail-card__item">
              <span className="detail-card__label">Estacionamiento</span>
              <span className="detail-card__value">{propiedad.estacionamiento ? 'Sí' : 'No'}</span>
            </div>
          </div>
        </div>

        {propiedad.descripcion && (
          <div className="detail-card">
            <h2>Descripción</h2>
            <p>{propiedad.descripcion}</p>
          </div>
        )}
      </section>
    </div>
  );
}
