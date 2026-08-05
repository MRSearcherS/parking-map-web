'use client';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import GeolocationControl from './GeolocationControl';
import L from 'leaflet';
import type { ParkingPlace } from '@/lib/parking';

type Props = {
  center: { lat: number; lng: number };
  parkings: ParkingPlace[];
  isPro: boolean;
  loading: boolean;
};

function markerIcon(isDemo: boolean) {
  return L.divIcon({
    className: '',
    html: `<div class="marker-button ${isDemo ? 'demo' : ''}">P</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export default function ParkingMap({ center, parkings, isPro, loading }: Props) {
  return (
    <div style={{ position: 'relative' }}>
      <div className="map-overlay">
        <strong>{isPro ? 'Реальные парковки открыты' : 'Демо-режим'}</strong>
        <span>
          {isPro
            ? 'На карте показаны точные места бесплатных парковок.'
            : 'В бесплатном режиме реальные координаты не загружаются. Показана только демонстрационная точка.'}
        </span>
        {loading ? <span>Загружаем данные...</span> : null}
      </div>

      <MapContainer
        center={[center.lat, center.lng]}
        zoom={13}
        scrollWheelZoom
        attributionControl={false}
        className="map-root"
      >
        <GeolocationControl autoLocate />

        <TileLayer
          attribution="OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        {parkings.map((parking) => (
          <Marker
            key={`${parking.is_demo ? 'demo' : 'real'}-${parking.id}`}
            position={[parking.latitude, parking.longitude]}
            icon={markerIcon(parking.is_demo)}
          >
            <Popup>
              <div className="popup-title">{parking.name}</div>
              {parking.address ? <div>{parking.address}</div> : null}
              {parking.description ? <div className="popup-muted">{parking.description}</div> : null}
              {parking.distance_meters != null ? (
                <div className="popup-muted">Расстояние: {formatDistance(parking.distance_meters)}</div>
              ) : null}
              {parking.is_demo ? (
                <div className="popup-muted">Это пример карточки. Реальные парковки доступны в PRO.</div>
              ) : null}
            </Popup>
          </Marker>
        ))}
      </MapContainer>
    </div>
  );
}

function formatDistance(meters: number) {
  if (meters < 1000) return `${Math.round(meters)} м`;
  return `${(meters / 1000).toFixed(1)} км`;
}
