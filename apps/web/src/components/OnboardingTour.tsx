import { useEffect, useState } from 'react';

export interface TourStep {
  /** Valor del atributo data-tour del elemento a resaltar. */
  target: string;
  titulo: string;
  texto: string;
}

interface OnboardingTourProps {
  steps: TourStep[];
  onCerrar: () => void;
}

function medirObjetivo(target: string): DOMRect | null {
  const el = document.querySelector<HTMLElement>(`[data-tour="${target}"]`);
  return el ? el.getBoundingClientRect() : null;
}

export function OnboardingTour({ steps, onCerrar }: OnboardingTourProps) {
  const [paso, setPaso] = useState(0);
  const [rect, setRect] = useState<DOMRect | null>(null);

  useEffect(() => {
    const actualizar = () => setRect(medirObjetivo(steps[paso].target));
    actualizar();
    window.addEventListener('resize', actualizar);
    return () => window.removeEventListener('resize', actualizar);
  }, [paso, steps]);

  const step = steps[paso];
  const esUltimo = paso === steps.length - 1;

  const margen = 10;
  const top = rect ? rect.bottom + margen : window.innerHeight / 2 - 60;
  const left = rect ? Math.min(rect.left, window.innerWidth - 340) : window.innerWidth / 2 - 160;

  return (
    <div className="onboarding-tour">
      {rect && (
        <div
          className="onboarding-tour__spotlight"
          style={{
            top: rect.top - margen,
            left: rect.left - margen,
            width: rect.width + margen * 2,
            height: rect.height + margen * 2,
          }}
        />
      )}
      <div className="onboarding-tour__tooltip" style={{ top, left }}>
        <p className="onboarding-tour__step">
          Paso {paso + 1} de {steps.length}
        </p>
        <h3>{step.titulo}</h3>
        <p>{step.texto}</p>
        <div className="onboarding-tour__actions">
          <button type="button" className="link-button" onClick={onCerrar}>
            Saltar
          </button>
          <div className="onboarding-tour__nav">
            {paso > 0 && (
              <button type="button" onClick={() => setPaso((p) => p - 1)}>
                Anterior
              </button>
            )}
            <button
              type="button"
              onClick={() => (esUltimo ? onCerrar() : setPaso((p) => p + 1))}
            >
              {esUltimo ? 'Entendido' : 'Siguiente'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
