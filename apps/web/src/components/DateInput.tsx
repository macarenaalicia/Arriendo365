import { maskFechaDDMMYYYY } from '../lib/format';

interface DateInputProps {
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
}

export function DateInput({ value, onChange, required }: DateInputProps) {
  return (
    <input
      type="text"
      inputMode="numeric"
      placeholder="dd/mm/aaaa"
      maxLength={10}
      required={required}
      value={value}
      onChange={(e) => onChange(maskFechaDDMMYYYY(e.target.value))}
    />
  );
}
