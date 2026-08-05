'use client';

import { useState } from 'react';
import { KeyRound } from 'lucide-react';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  email: string;
  disabled?: boolean;
};

export default function PasswordResetAction({ email, disabled = false }: Props) {
  const [open, setOpen] = useState(false);
  const [resetEmail, setResetEmail] = useState(email);
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  async function sendResetEmail() {
    const cleanEmail = resetEmail.trim() || email.trim();

    if (!cleanEmail) {
      setMessage('Введите email для восстановления пароля');
      return;
    }

    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Письмо отправлено. Откройте ссылку из письма и задайте новый пароль.');
  }

  return (
    <>
      <button
        className="password-reset-inline-button"
        type="button"
        disabled={disabled}
        onClick={() => {
          setResetEmail(email);
          setMessage('');
          setOpen(true);
        }}
      >
        <KeyRound size={16} />
        Забыли пароль?
      </button>

      {open ? (
        <div className="password-reset-modal-backdrop">
          <div className="password-reset-modal">
            <div className="password-reset-modal-header">
              <h2>Восстановление пароля</h2>
              <button type="button" onClick={() => setOpen(false)}>
                x
              </button>
            </div>

            <p className="password-reset-muted">
              Введите email аккаунта. Мы отправим ссылку для создания нового пароля.
            </p>

            <div className="password-reset-form">
              <input
                className="text-input"
                type="email"
                placeholder="Ваш email"
                value={resetEmail}
                onChange={(event) => setResetEmail(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    sendResetEmail();
                  }
                }}
              />

              <button
                className="primary-button"
                type="button"
                disabled={loading}
                onClick={sendResetEmail}
              >
                {loading ? 'Отправка...' : 'Отправить письмо'}
              </button>

              {message ? <div className="password-reset-message">{message}</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
