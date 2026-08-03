'use client';

import { useState } from 'react';
import { LogIn, LogOut, UserPlus } from 'lucide-react';
import type { AccessState } from '@/lib/access';
import { supabase } from '@/lib/supabaseClient';

type Props = {
  access: AccessState;
  onAuthChange: () => Promise<void>;
};

export function AuthPanel({ access, onAuthChange }: Props) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [busy, setBusy] = useState(false);

  async function signIn() {
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await onAuthChange();
  }

  async function signUp() {
    setBusy(true);
    setMessage('');
    const { error } = await supabase.auth.signUp({ email, password });
    setBusy(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    setMessage('Аккаунт создан. Если Supabase требует подтверждение email, откройте письмо.');
    await onAuthChange();
  }

  async function signOut() {
    await supabase.auth.signOut();
    await onAuthChange();
  }

  if (access.user) {
    return (
      <div className="auth-card">
        <h2>Аккаунт</h2>
        <p>{access.user.email}</p>
        <p>Уровень доступа: {access.isPro ? 'PRO' : 'Free'}</p>
        <div className="auth-form">
          <button className="secondary-button" onClick={signOut}>
            <LogOut size={18} /> Выйти
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="auth-card">
      <h2>Вход</h2>
      <p>Войдите или создайте аккаунт. PRO-доступ в MVP включается вручную в Supabase.</p>
      <div className="auth-form">
        <input
          className="text-input"
          type="email"
          placeholder="Email"
          value={email}
          onChange={(event) => setEmail(event.target.value)}
        />
        <input
          className="text-input"
          type="password"
          placeholder="Пароль"
          value={password}
          onChange={(event) => setPassword(event.target.value)}
        />
        <div className="button-row">
          <button className="primary-button" disabled={busy} onClick={signIn}>
            <LogIn size={18} /> Войти
          </button>
          <button className="secondary-button" disabled={busy} onClick={signUp}>
            <UserPlus size={18} /> Создать
          </button>
        </div>
        {message ? <p>{message}</p> : null}
      </div>
    </div>
  );
}
