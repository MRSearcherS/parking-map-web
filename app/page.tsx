'use client';

import dynamic from 'next/dynamic';
import { useEffect, useMemo, useState } from 'react';
import { AuthPanel } from '@/components/AuthPanel';
import { Paywall } from '@/components/Paywall';
import { getAccessState, type AccessState } from '@/lib/access';
import { getNearbyParkings, type ParkingPlace } from '@/lib/parking';

const ParkingMap = dynamic(() => import('@/components/ParkingMap'), {
  ssr: false,
  loading: () => <div className="map-loading">Загружаем карту...</div>,
});

const MOSCOW_CENTER = { lat: 55.7558, lng: 37.6173 };

export default function HomePage() {
  const [access, setAccess] = useState<AccessState>({ status: 'loading', isPro: false, user: null });
  const [center, setCenter] = useState(MOSCOW_CENTER);
  const [parkings, setParkings] = useState<ParkingPlace[]>([]);
  const [nearbyCount, setNearbyCount] = useState(0);
  const [loadingParkings, setLoadingParkings] = useState(true);
  const [locationMessage, setLocationMessage] = useState('Москва выбрана по умолчанию');

  const refreshAccess = async () => {
    const nextAccess = await getAccessState();
    setAccess(nextAccess);
  };

  useEffect(() => {
    refreshAccess();
  }, []);

  useEffect(() => {
    if (!navigator.geolocation) {
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setCenter({ lat: position.coords.latitude, lng: position.coords.longitude });
        setLocationMessage('Используем ваше местоположение');
      },
      () => {
        setLocationMessage('Геолокация недоступна, показываем Москву');
      },
      { enableHighAccuracy: true, timeout: 8000 },
    );
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function loadParkings() {
      setLoadingParkings(true);
      try {
        const result = await getNearbyParkings({
          latitude: center.lat,
          longitude: center.lng,
          isPro: access.isPro,
        });

        if (!cancelled) {
          setParkings(result.parkings);
          setNearbyCount(result.nearbyCount);
        }
      } finally {
        if (!cancelled) {
          setLoadingParkings(false);
        }
      }
    }

    if (access.status !== 'loading') {
      loadParkings();
    }

    return () => {
      cancelled = true;
    };
  }, [access.status, access.isPro, center.lat, center.lng]);

  const modeLabel = useMemo(() => {
    if (access.status === 'loading') return 'Проверяем доступ';
    return access.isPro ? 'PRO доступ активен' : 'Бесплатный режим';
  }, [access.status, access.isPro]);

  return (
    <main className="page-shell">
      <section className="topbar" aria-label="Управление доступом">
        <div>
          <h1>Бесплатные парковки</h1>
          <p>{locationMessage}</p>
        </div>
        <div className="status-pill">{modeLabel}</div>
      </section>

      <section className="workspace">
        <div className="map-panel">
          <ParkingMap
            center={center}
            parkings={parkings}
            isPro={access.isPro}
            loading={loadingParkings}
          />
        </div>

        <aside className="side-panel">
          <AuthPanel access={access} onAuthChange={refreshAccess} />
          <Paywall isPro={access.isPro} nearbyCount={nearbyCount} />

          <div className="compact-card">
            <h2>Что видно сейчас</h2>
            <p>
              {access.isPro
                ? 'Вы видите реальные бесплатные парковки рядом с выбранной точкой.'
                : 'Реальные координаты скрыты. На карте показана только демонстрационная карточка.'}
            </p>
          </div>
        </aside>
      </section>
    </main>
  );
}
