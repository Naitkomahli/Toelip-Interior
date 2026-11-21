import { useState, type InputHTMLAttributes } from 'react';
import { IconEye } from './icons';

interface PasswordInputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'type'> {
  id: string;
}

export function PasswordInput({ id, className, ...props }: PasswordInputProps) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="password-field">
      <input
        id={id}
        type={visible ? 'text' : 'password'}
        className={className ?? 'input'}
        {...props}
      />
      <button
        type="button"
        className="password-toggle"
        aria-label={visible ? 'Sembunyikan kata sandi' : 'Tampilkan kata sandi'}
        aria-pressed={visible}
        onClick={() => setVisible((value) => !value)}
      >
        <IconEye size={17} />
      </button>
    </div>
  );
}
