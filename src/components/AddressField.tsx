'use client';

import { useEffect, useRef, useState } from 'react';
import { Crosshair, MapPin } from 'lucide-react';
import { loadGoogleMaps } from '@/lib/google-maps';
import type { AddressSelection } from '@/types/app';

type Props = {
  value: AddressSelection;
  onChange: (value: AddressSelection) => void;
};

export function AddressField({ value, onChange }: Props) {
  const inputRef = useRef<HTMLInputElement | null>(null);
  const [error, setError] = useState<string>('');
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    if (!inputRef.current) return;
    let autocomplete: any;

    loadGoogleMaps()
      .then((google) => {
        autocomplete = new google.maps.places.Autocomplete(inputRef.current, {
          componentRestrictions: { country: 'cl' },
          fields: ['formatted_address', 'geometry', 'address_components', 'place_id', 'name'],
        });
        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          const components = place.address_components || [];
          const comuna =
            components.find((c: any) => c.types.includes('administrative_area_level_3'))?.long_name ||
            components.find((c: any) => c.types.includes('locality'))?.long_name ||
            value.comuna ||
            '';

          onChange({
            ...value,
            addressLine: place.name || value.addressLine,
            formattedAddress: place.formatted_address || value.formattedAddress,
            placeId: place.place_id || value.placeId,
            comuna,
            latitude: place.geometry?.location?.lat?.() ?? null,
            longitude: place.geometry?.location?.lng?.() ?? null,
          });
        });
      })
      .catch(() => setError('No se pudo cargar el autocompletado de direcciones.'));

    return () => {
      if (autocomplete) {
        autocomplete.unbindAll?.();
      }
    };
  }, []);

  async function useCurrentLocation() {
    if (!navigator.geolocation) {
      setError('Tu navegador no soporta geolocalización.');
      return;
    }

    setError('');
    setLoadingLocation(true);

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const google = await loadGoogleMaps();
          const geocoder = new google.maps.Geocoder();
          const { results } = await geocoder.geocode({
            location: {
              lat: position.coords.latitude,
              lng: position.coords.longitude,
            },
          });

          const first = results?.[0];
          const components = first?.address_components || [];
          const comuna =
            components.find((c: any) => c.types.includes('administrative_area_level_3'))?.long_name ||
            components.find((c: any) => c.types.includes('locality'))?.long_name ||
            value.comuna ||
            '';

          onChange({
            ...value,
            addressLine: first?.formatted_address || value.addressLine,
            formattedAddress: first?.formatted_address || value.formattedAddress,
            placeId: first?.place_id || value.placeId,
            comuna,
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        } catch {
          setError('No se pudo convertir tu ubicación en una dirección válida.');
        } finally {
          setLoadingLocation(false);
        }
      },
      () => {
        setError('No se pudo obtener tu ubicación actual.');
        setLoadingLocation(false);
      },
      { enableHighAccuracy: true, timeout: 10000 },
    );
  }

  return (
    <div className="stack gap12">
      <label className="label">Dirección de entrega</label>
      <div className="row gap8 alignCenter">
        <div className="inputIconWrap grow">
          <MapPin size={18} />
          <input
            ref={inputRef}
            className="input"
            placeholder="Escribe la dirección y elige la sugerencia correcta"
            value={value.addressLine}
            onChange={(e) => onChange({ ...value, addressLine: e.target.value })}
          />
        </div>
        <button className="btn secondary" type="button" onClick={useCurrentLocation} disabled={loadingLocation}>
          <Crosshair size={16} />
          {loadingLocation ? 'Buscando...' : 'Mi ubicación'}
        </button>
      </div>
      <input
        className="input"
        placeholder="Referencia de entrega: depto, portón, casa, color, etc."
        value={value.addressRef || ''}
        onChange={(e) => onChange({ ...value, addressRef: e.target.value })}
      />
      <input
        className="input"
        placeholder="Comuna"
        value={value.comuna}
        onChange={(e) => onChange({ ...value, comuna: e.target.value })}
      />
      {value.formattedAddress ? <div className="muted small">Dirección confirmada: {value.formattedAddress}</div> : null}
      {error ? <div className="errorText">{error}</div> : null}
    </div>
  );
}
