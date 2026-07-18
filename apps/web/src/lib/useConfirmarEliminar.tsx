import { useState } from 'react';
import { ApiError } from '../api/client';
import { ConfirmDeleteModal } from '../components/ConfirmDeleteModal';

/** Centraliza el flujo "click en eliminar -> escribir frase de confirmación -> ejecutar". */
export function useConfirmarEliminar<T>(onConfirmar: (objetivo: T) => void | Promise<void>) {
  const [pendiente, setPendiente] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);

  const pedir = (objetivo: T) => {
    setError(null);
    setPendiente(objetivo);
  };

  const confirmar = async () => {
    if (pendiente === null) return;
    try {
      await onConfirmar(pendiente);
      setPendiente(null);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'No se pudo eliminar.');
    }
  };

  const modal =
    pendiente !== null ? (
      <ConfirmDeleteModal
        error={error}
        onConfirm={confirmar}
        onClose={() => {
          setPendiente(null);
          setError(null);
        }}
      />
    ) : null;

  return { pedir, modal };
}
