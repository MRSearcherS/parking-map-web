'use client';

import { MapContainer, Marker, Popup, TileLayer } from 'react-leaflet';
import L from 'leaflet';

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
};

type Props = {
  parkings: AdminParking[];
};

function markerIcon(parking: AdminParking) {
  let background = '#1f8a4c';

  if (!parking.is_approved) {
    background = '#d64545';
  } else if (parking.is_demo) {
    background = '#2266aa';
  } else if (!parking.is_verified) {
    background = '#d99022';
  }

  return L.divIcon({
    className: '',
    html: `<div style="
      width: 34px;
      height: 34px;
      border-radius: 50%;
      background: ${background};
      color: white;
      border: 3px solid white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 800;
      box-shadow: 0 7px 16px rgba(0,0,0,.25);
    ">P</div>`,
    iconSize: [34, 34],
    iconAnchor: [17, 17],
  });
}

export default function AdminParkingMap({ parkings }: Props) {
  const validParkings = parkings.filter(
    (p) => Number.isFinite(p.latitude) && Number.isFinite(p.longitude),
  );

  const center = validParkings[0]
    ? [validParkings[0].latitude, validParkings[0].longitude]
    : [55.7558, 37.6173];

  return (
    <MapContainer
      center={center as [number, number]}
      zoom={12}
      scrollWheelZoom
      style={{
        height: 460,
        width: '100%',
        borderRadius: 12,
      }}
    >
      <TileLayer
        attribution='&copy; OpenStreetMap contributors &copy; CARTO'
        url="https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png"
      />

      {validParkings.map((parking) => (
        <Marker
          key={parking.id}
          position={[parking.latitude, parking.longitude]}
          icon={markerIcon(parking)}
        >
          <Popup>
            <div style={{ fontWeight: 800 }}>{parking.name}</div>
            {parking.address ? <div>{parking.address}</div> : null}
            {parking.description ? (
              <div style={{ color: '#526052', marginTop: 4, whiteSpace: 'pre-wrap' }}>
                {parking.description}
              </div>
            ) : null}
            <div style={{ marginTop: 8, fontSize: 12 }}>
              ID: {parking.id}
              <br />
              Статус: {parking.is_approved ? 'одобрена' : 'не одобрена'}
              <br />
              Проверена: {parking.is_verified ? 'да' : 'нет'}
              <br />
              Demo: {parking.is_demo ? 'да' : 'нет'}
            </div>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

