import { useEffect, useState } from 'react';
import { useAuth } from '../auth/AuthContext';

function claveVisto(vista: string, usuarioId: string | null) {
  return `arriendo365_tour_${vista}_${usuarioId ?? 'anon'}`;
}

/** Muestra un tour guiado la primera vez que este usuario visita esta vista. */
export function useOnboardingTour(vista: string) {
  const { usuarioId } = useAuth();
  const [activo, setActivo] = useState(false);

  useEffect(() => {
    if (!usuarioId) return;
    const visto = localStorage.getItem(claveVisto(vista, usuarioId));
    if (!visto) setActivo(true);
  }, [vista, usuarioId]);

  const cerrar = () => {
    if (usuarioId) localStorage.setItem(claveVisto(vista, usuarioId), '1');
    setActivo(false);
  };

  return { activo, cerrar };
}
