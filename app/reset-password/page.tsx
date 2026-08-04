'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabaseClient';

export default function ResetPasswordPage() {
  const router = useRouter();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);

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

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Пароль изменён. Сейчас перенаправим вас...');
    setTimeout(() => {
      router.push('/');
    }, 1200);
  }

  return (
    <main className="admin-page">
      <div className="admin-login-card">
        <h1>Сброс пароля</h1>
        <p>Введите новый пароль для вашего аккаунта.</p>

        <div className="admin-form">
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
          />

          <button className="primary-button" disabled={loading} onClick={updatePassword}>
            {loading ? 'Сохранение...' : 'Сохранить новый пароль'}
          </button>

          {message ? <div className="admin-message">{message}</div> : null}
        </div>
      </div>
    </main>
  );
}
