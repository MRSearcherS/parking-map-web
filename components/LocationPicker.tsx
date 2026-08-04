'use client';

import { useMemo, useState } from 'react';
import { MapContainer, Marker, Popup, TileLayer, useMap, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

type ExistingParking = {
  id: number;
  name: string;
  address: string | null;
  latitude: number;
  longitude: number;
  is_approved?: boolean;
  is_verified?: boolean;
  is_demo?: boolean;
};

type Props = {
  value: {
    lat: number | null;
    lng: number | null;
  };
  onChange: (value: { lat: number; lng: number }) => void;
  onAddressChange?: (address: string) => void;
  height?: number;
  center?: [number, number];
  zoom?: number;
  showSearch?: boolean;
  existingParkings?: ExistingParking[];
};

type FlyToProps = {
  position: [number, number] | null;
};

function FlyToSelected({ position }: FlyToProps) {
  const map = useMap();

  if (position) {
    map.flyTo(position, Math.max(map.getZoom(), 15), {
      animate: true,
      duration: 0.5,
    });
  }

  return null;
}

function ClickHandler({
  onPick,
}: {
  onPick: (value: { lat: number; lng: number }) => void;
}) {
  useMapEvents({
    click(e) {
      onPick({
        lat: e.latlng.lat,
        lng: e.latlng.lng,
      });
    },
  });

  return null;
}

async function reverseGeocode(lat: number, lng: number) {
  const url =
    'https://nominatim.openstreetmap.org/reverse' +
    `?format=jsonv2&lat=${encodeURIComponent(lat)}` +
    `&lon=${encodeURIComponent(lng)}` +
    '&accept-language=ru';

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Не удалось определить адрес');
  }

  const json = await res.json();

  return String(json.display_name || '').trim();
}

async function searchLocation(query: string) {
  const url =
    'https://nominatim.openstreetmap.org/search' +
    `?format=jsonv2&q=${encodeURIComponent(query)}` +
    '&limit=5' +
    '&accept-language=ru';

  const res = await fetch(url);

  if (!res.ok) {
    throw new Error('Ошибка поиска');
  }

  const json = await res.json();

  return Array.isArray(json)
    ? json.map((item) => ({
        label: String(item.display_name || ''),
        lat: Number(item.lat),
        lng: Number(item.lon),
      }))
    : [];
}

export default function LocationPicker({
  value,
  onChange,
  onAddressChange,
  height = 360,
  center = [55.7558, 37.6173],
  zoom = 12,
  showSearch = true,
  existingParkings = [],
}: Props) {
  const [query, setQuery] = useState('');
  const [searchResults, setSearchResults] = useState<
    { label: string; lat: number; lng: number }[]
  >([]);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [loadingAddress, setLoadingAddress] = useState(false);
  const [message, setMessage] = useState('');

  const selectedIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `<div style="
          width: 34px;
          height: 34px;
          border-radius: 50%;
          background: #1f8a4c;
          color: white;
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-weight: 900;
          box-shadow: 0 8px 18px rgba(0,0,0,.30);
        ">✓</div>`,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      }),
    [],
  );

  const existingIcon = useMemo(
    () =>
      L.divIcon({
        className: '',
        html: `<div style="
          width: 24px;
          height: 24px;
          border-radius: 50%;
          background: #2266aa;
          color: white;
          border: 2px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 11px;
          font-weight: 800;
          box-shadow: 0 5px 12px rgba(0,0,0,.22);
          opacity: .85;
        ">P</div>`,
        iconSize: [24, 24],
        iconAnchor: [12, 12],
      }),
    [],
  );

  const markerPosition =
    value.lat !== null && value.lng !== null ? ([value.lat, value.lng] as [number, number]) : null;

  async function pickPoint(lat: number, lng: number, shouldReverseGeocode = true) {
    setMessage('');

    onChange({
      lat,
      lng,
    });

    if (!shouldReverseGeocode || !onAddressChange) {
      return;
    }

    setLoadingAddress(true);

    try {
      const address = await reverseGeocode(lat, lng);

      if (address) {
        onAddressChange(address);
        setMessage('Адрес подставлен автоматически. Проверьте его перед сохранением.');
      }
    } catch {
      setMessage('Точка выбрана, но адрес автоматически определить не удалось.');
    } finally {
      setLoadingAddress(false);
    }
  }

  async function runSearch() {
    const cleanQuery = query.trim();

    if (!cleanQuery) {
      setMessage('Введите адрес или название места для поиска');
      return;
    }

    setLoadingSearch(true);
    setMessage('');
    setSearchResults([]);

    try {
      const results = await searchLocation(cleanQuery);

      if (!results.length) {
        setMessage('Ничего не найдено. Попробуйте уточнить запрос.');
        return;
      }

      setSearchResults(results);
      setMessage('Выберите подходящий результат поиска.');
    } catch {
      setMessage('Не удалось выполнить поиск. Попробуйте позже.');
    } finally {
      setLoadingSearch(false);
    }
  }

  function selectSearchResult(result: { label: string; lat: number; lng: number }) {
    setSearchResults([]);
    setQuery(result.label);

    if (onAddressChange) {
      onAddressChange(result.label);
    }

    pickPoint(result.lat, result.lng, false);
  }

  return (
    <div className="location-picker">
      {showSearch ? (
        <div className="location-picker-search">
          <input
            className="text-input"
            placeholder="Найти адрес или место, например: Москва, Тверская 1"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === 'Enter') {
                event.preventDefault();
                runSearch();
              }
            }}
          />

          <button
            className="secondary-button"
            type="button"
            disabled={loadingSearch}
            onClick={runSearch}
          >
            {loadingSearch ? 'Поиск...' : 'Найти'}
          </button>
        </div>
      ) : null}

      {searchResults.length ? (
        <div className="location-picker-results">
          {searchResults.map((result, index) => (
            <button
              key={`${result.lat}-${result.lng}-${index}`}
              type="button"
              onClick={() => selectSearchResult(result)}
            >
              {result.label}
            </button>
          ))}
        </div>
      ) : null}

      <MapContainer
        center={markerPosition ?? center}
        zoom={zoom}
        scrollWheelZoom
        style={{
          height,
          width: '100%',
          borderRadius: 12,
          overflow: 'hidden',
        }}
      >
        <TileLayer
          attribution="OpenStreetMap"
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />

        <ClickHandler onPick={({ lat, lng }) => pickPoint(lat, lng)} />
        <FlyToSelected position={markerPosition} />

        {existingParkings
          .filter((parking) => Number.isFinite(parking.latitude) && Number.isFinite(parking.longitude))
          .map((parking) => (
            <Marker
              key={parking.id}
              position={[parking.latitude, parking.longitude]}
              icon={existingIcon}
            >
              <Popup>
                <div style={{ fontWeight: 800 }}>{parking.name}</div>
                {parking.address ? <div>{parking.address}</div> : null}
                <div style={{ marginTop: 6, fontSize: 12 }}>
                  Уже существующая парковка
                  <br />
                  ID: {parking.id}
                </div>
              </Popup>
            </Marker>
          ))}

        {markerPosition ? (
          <Marker
            position={markerPosition}
            icon={selectedIcon}
            draggable
            eventHandlers={{
              dragend(event) {
                const marker = event.target;
                const latLng = marker.getLatLng();

                pickPoint(latLng.lat, latLng.lng);
              },
            }}
          >
            <Popup>
              <div style={{ fontWeight: 800 }}>Новая точка</div>
              <div>
                {value.lat?.toFixed(6)}, {value.lng?.toFixed(6)}
              </div>
              <div style={{ marginTop: 6, fontSize: 12 }}>
                Маркер можно перетаскивать.
              </div>
            </Popup>
          </Marker>
        ) : null}
      </MapContainer>

      <div className="location-picker-hint">
        Кликните по карте, чтобы поставить точку. После выбора маркер можно перетащить.
      </div>

      {markerPosition ? (
        <div className="location-picker-coords">
          Выбрано: {value.lat?.toFixed(6)}, {value.lng?.toFixed(6)}
          {loadingAddress ? ' — определяю адрес...' : ''}
        </div>
      ) : (
        <div className="location-picker-coords">Точка пока не выбрана</div>
      )}

      {message ? <div className="location-picker-message">{message}</div> : null}
    </div>
  );
}
