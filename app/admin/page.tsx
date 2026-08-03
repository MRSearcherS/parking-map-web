'use client';

import { useEffect, useState } from 'react';

export default function AdminPage() {
  const [data, setData] = useState<{ parkings: any[]; users: any[] } | null>(null);
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/api/admin/list')
      .then((r) => r.json())
      .then((d) => setData(d))
      .catch(console.error);
  }, []);

  async function approve(id: number) {
    setLoading(true);
    await fetch('/api/admin/approve', { method: 'POST', body: JSON.stringify({ parkingId: id }) });
    setLoading(false);
    window.location.reload();
  }

  async function reject(id: number) {
    setLoading(true);
    await fetch('/api/admin/reject', { method: 'POST', body: JSON.stringify({ parkingId: id }) });
    setLoading(false);
    window.location.reload();
  }

  async function setPro() {
    setMessage('');
    setLoading(true);
    const res = await fetch('/api/admin/set-pro', { method: 'POST', body: JSON.stringify({ email, months: 1 }) });
    const json = await res.json();
    setLoading(false);
    if (json.ok) setMessage('PRO выставлен'); else setMessage(JSON.stringify(json));
  }

  return (
    <div style={{ padding: 20 }}>
      <h1>Admin</h1>
      <section>
        <h2>Пользователи</h2>
        <table>
          <thead>
            <tr><th>Email</th><th>Access</th><th>pro_until</th></tr>
          </thead>
          <tbody>
            {data?.users?.map((u: any) => (
              <tr key={u.id}><td>{u.email}</td><td>{u.access_level}</td><td>{u.pro_until}</td></tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Парковки</h2>
        <table>
          <thead><tr><th>id</th><th>name</th><th>approved</th><th>actions</th></tr></thead>
          <tbody>
            {data?.parkings?.map((p: any) => (
              <tr key={p.id}>
                <td>{p.id}</td>
                <td>{p.name}</td>
                <td>{p.is_approved ? 'yes' : 'no'}</td>
                <td>
                  <button onClick={() => approve(p.id)}>Approve</button>
                  <button onClick={() => reject(p.id)}>Reject</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </section>

      <section>
        <h2>Выдать PRO</h2>
        <input placeholder="email" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button onClick={setPro} disabled={loading}>Выдать PRO на месяц</button>
        <div>{message}</div>
      </section>
    </div>
  );
}
