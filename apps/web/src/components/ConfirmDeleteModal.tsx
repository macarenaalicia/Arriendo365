import { useState } from 'react';
import { Modal } from './Modal';

export const FRASE_CONFIRMACION_ELIMINAR = 'Deseo eliminar este registro';

interface ConfirmDeleteModalProps {
  titulo?: string;
  error?: string | null;
  onConfirm: () => void;
  onClose: () => void;
}

export function ConfirmDeleteModal({
  titulo = 'Eliminar registro',
  error,
  onConfirm,
  onClose,
}: ConfirmDeleteModalProps) {
  const [texto, setTexto] = useState('');

  return (
    <Modal titulo={titulo} onClose={onClose}>
      <div className="inline-form">
        {error && <p className="auth-card__error">{error}</p>}
        <p>
          Esta acción no se puede deshacer. Para confirmar, escribe exactamente:
          <br />
          <strong>{FRASE_CONFIRMACION_ELIMINAR}</strong>
        </p>
        <input
          autoFocus
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          placeholder={FRASE_CONFIRMACION_ELIMINAR}
        />
        <button
          type="button"
          className="danger"
          disabled={texto.trim() !== FRASE_CONFIRMACION_ELIMINAR}
          onClick={onConfirm}
        >
          Eliminar
        </button>
      </div>
    </Modal>
  );
}
