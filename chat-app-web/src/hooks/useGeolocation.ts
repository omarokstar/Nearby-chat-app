import { useState, useCallback } from 'react';

interface GeoState {
  latitude: number | null;
  longitude: number | null;
  error: string | null;
  loading: boolean;
}

/**
 * Hook providing access to the browser's Geolocation API.
 * Supports requesting fresh GPS coordinates with configurable maximum age and error handling.
 */
export function useGeolocation() {
  const [state, setState] = useState<GeoState>({
    latitude: null,
    longitude: null,
    error: null,
    loading: false,
  });

  const requestLocation = useCallback(
    (forceFresh = false): Promise<{ latitude: number; longitude: number } | null> => {
      if (!navigator.geolocation) {
        setState((s) => ({ ...s, error: 'Geolocation is not supported by your browser.' }));
        return Promise.resolve(null);
      }

      setState((s) => ({ ...s, loading: true, error: null }));

      return new Promise((resolve) => {
        navigator.geolocation.getCurrentPosition(
          (pos) => {
            const coords = {
              latitude: pos.coords.latitude,
              longitude: pos.coords.longitude,
            };
            setState({
              ...coords,
              error: null,
              loading: false,
            });
            resolve(coords);
          },
          (err) => {
            let msg = 'Unable to retrieve your location.';
            if (err.code === err.PERMISSION_DENIED) {
              msg =
                'Location permission denied. Please allow location access in your browser settings and try again.';
            } else if (err.code === err.POSITION_UNAVAILABLE) {
              msg = 'Location information is unavailable.';
            } else if (err.code === err.TIMEOUT) {
              msg = 'Location request timed out. Please try again.';
            }
            setState((s) => ({ ...s, error: msg, loading: false }));
            resolve(null);
          },
          {
            enableHighAccuracy: true,
            timeout: 15_000,
            maximumAge: forceFresh ? 0 : 60_000,
          },
        );
      });
    },
    [],
  );

  return { ...state, requestLocation };
}
