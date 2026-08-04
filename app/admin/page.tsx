'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { supabase } from '@/lib/supabaseClient';

const AdminParkingMap = dynamic(() => import('@/components/AdminParkingMap'), {
  ssr: false,
  loading: () => <div className="admin-map-loading">Загрузка карты...</div>,
});

type AdminUser = {
  id: string;
  email: string | null;
  access_level: string;
  pro_until: string | null;
  created_at?: string;
};

type AdminParking = {
  id: number;
  name: string;
  address: string | null;
  description: string | null;
  latitude: number;
  longitude: number;
  is_free: boolean;
  is_verified: boolean;
  is_approved: boolean;
  is_demo: boolean;
  created_at?: string;
};

type AdminData = {
  parkings: AdminParking[];
  users: AdminUser[];
};

type Tab = 'parkings' | 'users' | 'create';

export default function AdminPage() {
  const [sessionChecked, setSessionChecked] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [currentEmail, setCurrentEmail] = useState<string | null>(null);

  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');

  const [data, setData] = useState<AdminData>({ parkings: [], users: [] });
  const [activeTab, setActiveTab] = useState<Tab>('parkings');

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [proEmail, setProEmail] = useState('');
  const [proMonths, setProMonths] = useState(1);

  const [newParking, setNewParking] = useState({
    name: '',
    address: '',
    description: '',
    latitude: '',
    longitude: '',
    is_free: true,
    is_verified: true,
    is_approved: true,
    is_demo: false,
  });

  const pendingParkings = useMemo(() => {
    return data.parkings.filter((p) => !p.is_approved || !p.is_verified);
  }, [data.parkings]);

  async function getToken() {
    const { data: sessionData } = await supabase.auth.getSession();
    return sessionData.session?.access_token || null;
  }

  async function adminFetch(url: string, options: RequestInit = {}) {
    const token = await getToken();

    return fetch(url, {
      ...options,
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
        ...(options.headers || {}),
      },
    });
  }

  async function loadData() {
    setLoading(true);
    setMessage('');

    try {
      const res = await adminFetch('/api/admin/list');
      const json = await res.json();

      if (!res.ok) {
        setMessage(json.error || 'Ошибка загрузки данных');
        return;
      }

      setData({
        parkings: json.parkings || [],
        users: json.users || [],
      });
    } finally {
      setLoading(false);
    }
  }

  async function checkAdmin() {
    setSessionChecked(false);
    setMessage('');

    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;

    if (!user) {
      setIsAdmin(false);
      setCurrentEmail(null);
      setSessionChecked(true);
      return;
    }

    setCurrentEmail(user.email ?? null);

    const { data: profile, error } = await supabase
      .from('profiles')
      .select('access_level')
      .eq('id', user.id)
      .maybeSingle();

    if (error) {
      setMessage(error.message);
      setIsAdmin(false);
      setSessionChecked(true);
      return;
    }

    const admin = profile?.access_level === 'admin';

    setIsAdmin(admin);
    setSessionChecked(true);

    if (admin) {
      await loadData();
    }
  }

  useEffect(() => {
    checkAdmin();
  }, []);

  async function signIn() {
    setLoading(true);
    setMessage('');

    const { error } = await supabase.auth.signInWithPassword({
      email: loginEmail,
      password: loginPassword,
    });

    setLoading(false);

    if (error) {
      setMessage(error.message);
      return;
    }

    await checkAdmin();
  }

  async function signOut() {
    await supabase.auth.signOut();
    setIsAdmin(false);
    setCurrentEmail(null);
    setData({ parkings: [], users: [] });
  }

  async function approve(id: number) {
    setLoading(true);
    setMessage('');

    const res = await adminFetch('/api/admin/approve', {
      method: 'POST',
      body: JSON.stringify({ parkingId: id }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || 'Ошибка approve');
      return;
    }

    await loadData();
  }

  async function reject(id: number) {
    setLoading(true);
    setMessage('');

    const res = await adminFetch('/api/admin/reject', {
      method: 'POST',
      body: JSON.stringify({ parkingId: id }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || 'Ошибка reject');
      return;
    }

    await loadData();
  }

  async function setPro() {
    setLoading(true);
    setMessage('');

    const res = await adminFetch('/api/admin/set-pro', {
      method: 'POST',
      body: JSON.stringify({
        email: proEmail,
        months: proMonths,
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || JSON.stringify(json));
      return;
    }

    setMessage('PRO выдан');
    setProEmail('');
    await loadData();
  }

  async function createParking() {
    setLoading(true);
    setMessage('');

    const res = await adminFetch('/api/admin/create-parking', {
      method: 'POST',
      body: JSON.stringify({
        ...newParking,
        latitude: Number(newParking.latitude),
        longitude: Number(newParking.longitude),
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || 'Ошибка создания парковки');
      return;
    }

    setMessage('Парковка добавлена');
    setNewParking({
      name: '',
      address: '',
      description: '',
      latitude: '',
      longitude: '',
      is_free: true,
      is_verified: true,
      is_approved: true,
      is_demo: false,
    });
    setActiveTab('parkings');
    await loadData();
  }

  if (!sessionChecked) {
    return (
      <main className="admin-page">
        <div className="admin-card">
          <h1>Админка</h1>
          <p>Проверка доступа...</p>
        </div>
      </main>
    );
  }

  if (!currentEmail) {
    return (
      <main className="admin-page">
        <div className="admin-login-card">
          <h1>Вход в админку</h1>
          <p>Введите email и пароль администратора.</p>

          <div className="admin-form">
            <input className="text-input" type="email" placeholder="Email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)} />
            <input className="text-input" type="password" placeholder="Пароль" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
            <button className="primary-button" disabled={loading} onClick={signIn}>Войти</button>
            {message ? <div className="admin-message">{message}</div> : null}
          </div>
        </div>
      </main>
    );
  }

  if (!isAdmin) {
    return (
      <main className="admin-page">
        <div className="admin-card">
          <h1>Доступ запрещён</h1>
          <p>Пользователь <b>{currentEmail}</b> не имеет прав администратора.</p>
          <button className="secondary-button" onClick={signOut}>Выйти</button>
          {message ? <div className="admin-message">{message}</div> : null}
        </div>
      </main>
    );
  }

  return (
    <main className="admin-page">
      <header className="admin-header">
        <div>
          <h1>Админка</h1>
          <p>Вы вошли как <b>{currentEmail}</b></p>
        </div>

        <div className="admin-header-actions">
          <button className="secondary-button" onClick={loadData} disabled={loading}>Обновить</button>
          <button className="secondary-button" onClick={signOut}>Выйти</button>
        </div>
      </header>

      <section className="admin-stats">
        <div className="admin-stat-card"><strong>{data.parkings.length}</strong><span>парковок всего</span></div>
        <div className="admin-stat-card"><strong>{pendingParkings.length}</strong><span>требуют проверки</span></div>
        <div className="admin-stat-card"><strong>{data.users.length}</strong><span>пользователей</span></div>
      </section>

      <nav className="admin-tabs">
        <button className={activeTab === 'parkings' ? 'active' : ''} onClick={() => setActiveTab('parkings')}>Парковки</button>
        <button className={activeTab === 'users' ? 'active' : ''} onClick={() => setActiveTab('users')}>Пользователи</button>
        <button className={activeTab === 'create' ? 'active' : ''} onClick={() => setActiveTab('create')}>Добавить парковку</button>
      </nav>

      {message ? <div className="admin-message">{message}</div> : null}

      {activeTab === 'parkings' ? (
        <section className="admin-grid">
          <div className="admin-card">
            <h2>Карта парковок</h2>
            <AdminParkingMap parkings={data.parkings} />
            <div className="admin-map-legend">
              <span><b className="dot green" /> Одобрена</span>
              <span><b className="dot orange" /> Не проверена</span>
              <span><b className="dot red" /> Не одобрена</span>
              <span><b className="dot blue" /> Demo</span>
            </div>
          </div>

          <div className="admin-card">
            <h2>Список парковок</h2>
            <div className="admin-table-wrap">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>ID</th>
                    <th>Название</th>
                    <th>Адрес</th>
                    <th>Координаты</th>
                    <th>Статус</th>
                    <th>Действия</th>
                  </tr>
                </thead>
                <tbody>
                  {data.parkings.map((p) => (
                    <tr key={p.id}>
                      <td>{p.id}</td>
                      <td>{p.name}</td>
                      <td>{p.address || '—'}</td>
                      <td>{p.latitude}, {p.longitude}</td>
                      <td>
                        {p.is_approved ? 'Одобрена' : 'Не одобрена'}
                        <br />
                        {p.is_verified ? 'Проверена' : 'Не проверена'}
                        <br />
                        {p.is_demo ? 'Demo' : ''}
                      </td>
                      <td>
                        <div className="admin-actions">
                          <button disabled={loading} onClick={() => approve(p.id)}>Одобрить</button>
                          <button disabled={loading} onClick={() => reject(p.id)}>Отклонить</button>
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!data.parkings.length ? <tr><td colSpan={6}>Парковок пока нет</td></tr> : null}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      ) : null}

      {activeTab === 'users' ? (
        <section className="admin-card">
          <h2>Пользователи</h2>

          <div className="admin-pro-box">
            <input className="text-input" placeholder="Email пользователя" value={proEmail} onChange={(e) => setProEmail(e.target.value)} />
            <input className="text-input" type="number" min={1} placeholder="Месяцев" value={proMonths} onChange={(e) => setProMonths(Number(e.target.value))} />
            <button className="primary-button" disabled={loading} onClick={setPro}>Выдать PRO</button>
          </div>

          <div className="admin-table-wrap">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Доступ</th>
                  <th>PRO до</th>
                  <th>ID</th>
                </tr>
              </thead>
              <tbody>
                {data.users.map((u) => (
                  <tr key={u.id}>
                    <td>{u.email || '—'}</td>
                    <td>{u.access_level}</td>
                    <td>{u.pro_until || '—'}</td>
                    <td>{u.id}</td>
                  </tr>
                ))}
                {!data.users.length ? <tr><td colSpan={4}>Пользователей пока нет</td></tr> : null}
              </tbody>
            </table>
          </div>
        </section>
      ) : null}

      {activeTab === 'create' ? (
        <section className="admin-card">
          <h2>Добавить парковку</h2>

          <div className="admin-form admin-create-form">
            <input className="text-input" placeholder="Название" value={newParking.name} onChange={(e) => setNewParking({ ...newParking, name: e.target.value })} />
            <input className="text-input" placeholder="Адрес" value={newParking.address} onChange={(e) => setNewParking({ ...newParking, address: e.target.value })} />
            <textarea className="admin-textarea" placeholder="Описание" value={newParking.description} onChange={(e) => setNewParking({ ...newParking, description: e.target.value })} />

            <div className="admin-two-cols">
              <input className="text-input" placeholder="Широта, например 55.7558" value={newParking.latitude} onChange={(e) => setNewParking({ ...newParking, latitude: e.target.value })} />
              <input className="text-input" placeholder="Долгота, например 37.6173" value={newParking.longitude} onChange={(e) => setNewParking({ ...newParking, longitude: e.target.value })} />
            </div>

            <label className="admin-checkbox">
              <input type="checkbox" checked={newParking.is_free} onChange={(e) => setNewParking({ ...newParking, is_free: e.target.checked })} />
              Бесплатная
            </label>

            <label className="admin-checkbox">
              <input type="checkbox" checked={newParking.is_verified} onChange={(e) => setNewParking({ ...newParking, is_verified: e.target.checked })} />
              Проверена
            </label>

            <label className="admin-checkbox">
              <input type="checkbox" checked={newParking.is_approved} onChange={(e) => setNewParking({ ...newParking, is_approved: e.target.checked })} />
              Одобрена
            </label>

            <label className="admin-checkbox">
              <input type="checkbox" checked={newParking.is_demo} onChange={(e) => setNewParking({ ...newParking, is_demo: e.target.checked })} />
              Demo-точка
            </label>

            <button className="primary-button" disabled={loading} onClick={createParking}>Добавить парковку</button>
          </div>
        </section>
      ) : null}
    </main>
  );
}
