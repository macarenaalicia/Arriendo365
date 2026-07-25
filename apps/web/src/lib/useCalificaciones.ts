import { useCallback, useEffect, useState } from 'react';
import { api } from '../api/client';
import type { CalificacionRequerimiento } from '../api/types';

export function useCalificaciones() {
  const [calificaciones, setCalificaciones] = useState<CalificacionRequerimiento[]>([]);

  const recargar = useCallback(() => {
    api.get<CalificacionRequerimiento[]>('/calificaciones-requerimiento').then(setCalificaciones);
  }, []);

  useEffect(recargar, [recargar]);

  return { calificaciones, recargarCalificaciones: recargar };
}
