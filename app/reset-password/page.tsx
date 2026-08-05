'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [ready, setReady] = useState(false);
  const [hasSession, setHasSession] = useState(false);
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('Проверяем ссылку восстановления...');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function checkSession() {
      const { data } = await supabase.auth.getSession();
      const sessionExists = Boolean(data.session);

      setHasSession(sessionExists);
      setReady(true);

      if (sessionExists) {
        setMessage('');
      } else {
        setMessage('Ссылка восстановления недействительна или устарела. Запросите новое письмо.');
      }
    }

    checkSession();
  }, []);

  async function updatePassword() {
    setMessage('');

    if (!password || password.length < 6) {
      setMessage('Пароль должен быть не короче 6 символов');
      return;
    }

    if (password !== confirmPassword) {
      setMessage('Пароли не совпадают');
      return;
    }

    setLoading(true);

    const { error } = await supabase.auth.updateUser({
      password,
    });

    if (error) {
      setLoading(false);
      setMessage(error.message);
      return;
    }

    sessionStorage.removeItem('passwordRecoveryInProgress');
    await supabase.auth.signOut();

    setLoading(false);
    setMessage('Пароль изменён. Теперь можно войти с новым паролем.');

    setTimeout(() => {
      router.push('/');
    }, 1400);
  }

  return (
    <main className="admin-page">
      <div className="admin-login-card">
        <h1>Сброс пароля</h1>
        <p>Введите новый пароль для вашего аккаунта.</p>

        <div className="admin-form">
          {ready && hasSession ? (
            <>
              <input
                className="text-input"
                type="password"
                placeholder="Новый пароль"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />

              <input
                className="text-input"
                type="password"
                placeholder="Повторите пароль"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter') {
                    event.preventDefault();
                    updatePassword();
                  }
                }}
              />

              <button className="primary-button" disabled={loading} onClick={updatePassword}>
                {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
              </button>
            </>
          ) : null}

          {message ? <div className="admin-message">{message}</div> : null}
        </div>
      </div>
    </main>
  );
}
