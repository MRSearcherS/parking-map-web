'use client';

import { useState } from 'react';
import { usePathname } from 'next/navigation';
import dynamic from 'next/dynamic';
import { supabase } from '@/lib/supabaseClient';

const LocationPicker = dynamic(() => import('@/components/LocationPicker'), {
  ssr: false,
  loading: () => <div className="admin-map-loading">Загрузка карты...</div>,
});

type Props = {
  embedded?: boolean;
};

export default function FloatingSuggestParking({ embedded = false }: Props) {
  const pathname = usePathname();

  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const [form, setForm] = useState({
    name: '',
    address: '',
    description: '',
    latitude: null as number | null,
    longitude: null as number | null,
  });

  if (!embedded && pathname?.startsWith('/admin')) {
    return null;
  }

  async function useMyLocation() {
    if (!navigator.geolocation) {
      setMessage('Геолокация не поддерживается браузером');
      return;
    }

    setMessage('Определяю местоположение...');

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setForm((prev) => ({
          ...prev,
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        }));
        setMessage('Координаты подставлены');
      },
      () => {
        setMessage('Не удалось получить местоположение');
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
      },
    );
  }

  async function submit() {
    setLoading(true);
    setMessage('');

    const { data: sessionData } = await supabase.auth.getSession();
    const token = sessionData.session?.access_token;

    if (!token) {
      setLoading(false);
      setMessage('Чтобы предложить парковку, сначала войдите в аккаунт.');
      return;
    }

    if (form.latitude === null || form.longitude === null) {
      setLoading(false);
      setMessage('Сначала выберите точку на карте');
      return;
    }

    const res = await fetch('/api/suggest-parking', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({
        ...form,
        latitude: Number(form.latitude),
        longitude: Number(form.longitude),
      }),
    });

    const json = await res.json();
    setLoading(false);

    if (!res.ok) {
      setMessage(json.error || 'Ошибка отправки');
      return;
    }

    setMessage(json.message || 'Парковка отправлена на проверку');
    setForm({
      name: '',
      address: '',
      description: '',
      latitude: null,
      longitude: null,
    });
  }

  return (
    <>
      <button
        className={embedded ? 'suggest-inline-button' : 'suggest-floating-button'}
        type="button"
        onClick={() => setOpen(true)}
      >
        Предложить парковку
      </button>

      {open ? (
        <div className="suggest-modal-backdrop">
          <div className="suggest-modal">
            <div className="suggest-modal-header">
              <h2>Предложить парковку</h2>
              <button type="button" onClick={() => setOpen(false)}>
                x
              </button>
            </div>

            <p className="suggest-muted">
              Кликните по карте, чтобы поставить точку. После проверки администратором она появится на карте.
            </p>

            <div className="suggest-form">
              <input
                className="text-input"
                placeholder="Название"
                value={form.name}
                onChange={(event) => setForm({ ...form, name: event.target.value })}
              />

              <input
                className="text-input"
                placeholder="Адрес"
                value={form.address}
                onChange={(event) => setForm({ ...form, address: event.target.value })}
              />

              <textarea
                className="suggest-textarea"
                placeholder="Описание"
                value={form.description}
                onChange={(event) => setForm({ ...form, description: event.target.value })}
              />

              <LocationPicker
                value={{
                  lat: form.latitude,
                  lng: form.longitude,
                }}
                onChange={({ lat, lng }) =>
                  setForm({
                    ...form,
                    latitude: lat,
                    longitude: lng,
                  })
                }
                onAddressChange={(address) =>
                  setForm((prev) => ({
                    ...prev,
                    address: prev.address.trim() ? prev.address : address,
                  }))
                }
                height={340}
              />

              <button className="secondary-button" type="button" onClick={useMyLocation}>
                Подставить мои координаты
              </button>

              <button className="primary-button" disabled={loading} onClick={submit}>
                {loading ? 'Отправка...' : 'Отправить на проверку'}
              </button>

              {message ? <div className="suggest-message">{message}</div> : null}
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}
