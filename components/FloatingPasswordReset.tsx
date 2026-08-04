'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function FloatingPasswordReset() {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

  if (pathname?.startsWith('/admin') || pathname?.startsWith('/reset-password')) {
    return null;
  }

  async function sendResetEmail() {
    const cleanEmail = email.trim();

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

    setMessage('Письмо для восстановления пароля отправлено. Проверьте почту.');
  }

  return (
    <>
      <button className="password-reset-floating-button" onClick={() => setOpen(true)}>
        Забыли пароль?
      </button>

      {open ? (
        <div className="password-reset-modal-backdrop">
          <div className="password-reset-modal">
            <div className="password-reset-modal-header">
              <h2>Восстановление пароля</h2>
              <button type="button" onClick={() => setOpen(false)}>
                ×
              </button>
            </div>

            <p className="password-reset-muted">
              Введите email вашего аккаунта. Мы отправим ссылку для создания нового пароля.
            </p>

            <div className="password-reset-form">
              <input
                className="text-input"
                type="email"
                placeholder="Ваш email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
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
