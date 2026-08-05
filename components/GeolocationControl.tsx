'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { useMap } from 'react-leaflet';

type Props = {
  autoLocate?: boolean;
};

export default function GeolocationControl({ autoLocate = false }: Props) {
  const map = useMap();

  useEffect(() => {
    const LocateControl = L.Control.extend({
      options: {
        position: 'topright',
      },

      onAdd() {
        const container = L.DomUtil.create('div', 'leaflet-bar');
        const button = L.DomUtil.create('button', '', container) as HTMLButtonElement;

        button.type = 'button';
        button.title = 'Показать мое местоположение';
        button.setAttribute('aria-label', 'Показать мое местоположение');
        button.innerHTML = '⌖';

        button.style.width = '34px';
        button.style.height = '34px';
        button.style.border = '0';
        button.style.background = '#ffffff';
        button.style.cursor = 'pointer';
        button.style.fontSize = '21px';
        button.style.lineHeight = '34px';
        button.style.fontWeight = '800';
        button.style.color = '#1f2a1f';

        L.DomEvent.disableClickPropagation(container);
        L.DomEvent.disableScrollPropagation(container);

        const locate = () => {
          if (!navigator.geolocation) {
            return;
          }

          navigator.geolocation.getCurrentPosition(
            (position) => {
              const latLng: [number, number] = [
                position.coords.latitude,
                position.coords.longitude,
              ];

              map.flyTo(latLng, Math.max(map.getZoom(), 15), {
                animate: true,
                duration: 0.7,
              });
            },
            () => undefined,
            {
              enableHighAccuracy: true,
              timeout: 10000,
              maximumAge: 60000,
            },
          );
        };

        L.DomEvent.on(button, 'click', (event) => {
          L.DomEvent.stop(event);
          locate();
        });

        if (autoLocate) {
          window.setTimeout(locate, 0);
        }

        return container;
      },
    });

    const control = new LocateControl();
    control.addTo(map);

    return () => {
      control.remove();
    };
  }, [map, autoLocate]);

  return null;
}
