import { useRef } from 'react';
import { ddmmyyyyToIso, isoToDdmmyyyy, maskFechaDDMMYYYY } from '../lib/format';
import { IconCalendario } from './icons';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function DateInput({ value, onChange, required }: DateInputProps) {
  const nativeRef = useRef<HTMLInputElement>(null);
  const isoValue = ddmmyyyyToIso(value) ?? '';

  return (
    <div className="date-input">
      <input
        type="text"
        inputMode="numeric"
        placeholder="dd/mm/aaaa"
        maxLength={10}
        required={required}
        value={value}
        onChange={(e) => onChange(maskFechaDDMMYYYY(e.target.value))}
      />
      <button
        type="button"
        className="date-input__calendario"
        title="Elegir fecha en el calendario"
        aria-label="Elegir fecha en el calendario"
        onClick={() => {
          const el = nativeRef.current;
          if (!el) return;
          if (typeof el.showPicker === 'function') el.showPicker();
          else el.focus();
        }}
      >
        <IconCalendario />
      </button>
      <input
        ref={nativeRef}
        type="date"
        className="date-input__nativo"
        tabIndex={-1}
        aria-hidden="true"
        value={isoValue}
        onChange={(e) => {
          if (e.target.value) onChange(isoToDdmmyyyy(e.target.value));
        }}
      />
    </div>
  );
}
