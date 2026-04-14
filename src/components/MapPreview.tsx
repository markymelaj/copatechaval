'use client';

import { useEffect, useRef } from 'react';
import { loadGoogleMaps } from '@/lib/google-maps';

type Props = {
  latitude?: number | null;
  longitude?: number | null;
  label?: string;
  className?: string;
};

export function MapPreview({ latitude, longitude, label, className }: Props) {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!ref.current || latitude == null || longitude == null) return;

    let marker: any;
    let map: any;

    loadGoogleMaps()
      .then((google) => {
        map = new google.maps.Map(ref.current, {
          center: { lat: Number(latitude), lng: Number(longitude) },
          zoom: 15,
          disableDefaultUI: true,
        });
        marker = new google.maps.Marker({
          map,
          position: { lat: Number(latitude), lng: Number(longitude) },
          title: label || 'Ubicación',
        });
      })
      .catch(() => {});

    return () => {
      if (marker) marker.setMap(null);
      map = null;
    };
  }, [latitude, longitude, label]);

  if (latitude == null || longitude == null) {
    return <div className={className || 'mapFrame empty'}>Sin coordenadas disponibles.</div>;
  }

  return <div ref={ref} className={className || 'mapFrame'} />;
}
