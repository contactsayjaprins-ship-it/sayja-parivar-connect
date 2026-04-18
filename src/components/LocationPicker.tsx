import { useEffect, useRef } from 'react';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { Loader2, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface Props {
  lat?: number | null;
  lng?: number | null;
  onChange: (lat: number, lng: number) => void;
}

const DEFAULT_CENTER = { lat: 22.3072, lng: 73.1812 }; // Vadodara, Gujarat

const LocationPicker = ({ lat, lng, onChange }: Props) => {
  const { ready, error } = useGoogleMaps();
  const divRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markerRef = useRef<any>(null);

  useEffect(() => {
    if (!ready || !divRef.current) return;
    const g = (window as any).google;
    const center = lat && lng ? { lat, lng } : DEFAULT_CENTER;
    mapRef.current = new g.maps.Map(divRef.current, {
      center,
      zoom: lat && lng ? 15 : 11,
      mapTypeControl: false,
      streetViewControl: false,
      fullscreenControl: false,
    });
    markerRef.current = new g.maps.Marker({
      position: center,
      map: mapRef.current,
      draggable: true,
    });
    if (!(lat && lng)) {
      // Don't fire onChange until user interacts
    }
    markerRef.current.addListener('dragend', () => {
      const p = markerRef.current.getPosition();
      onChange(p.lat(), p.lng());
    });
    mapRef.current.addListener('click', (e: any) => {
      markerRef.current.setPosition(e.latLng);
      onChange(e.latLng.lat(), e.latLng.lng());
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  useEffect(() => {
    if (!mapRef.current || !markerRef.current || lat == null || lng == null) return;
    const pos = { lat, lng };
    markerRef.current.setPosition(pos);
    mapRef.current.panTo(pos);
  }, [lat, lng]);

  const useMyLocation = () => {
    if (!navigator.geolocation) return;
    navigator.geolocation.getCurrentPosition(
      (pos) => onChange(pos.coords.latitude, pos.coords.longitude),
      () => {},
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        નકશો લોડ થઈ શક્યો નહીં: {error}
      </div>
    );
  }

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted-foreground">📍 નકશા પર ક્લિક કરો અથવા પિન ખસેડો</span>
        <Button type="button" size="sm" variant="outline" onClick={useMyLocation}>
          <MapPin className="w-4 h-4 mr-1" /> મારું લોકેશન
        </Button>
      </div>
      <div className="relative w-full h-64 rounded-xl overflow-hidden border border-border">
        {!ready && (
          <div className="absolute inset-0 flex items-center justify-center bg-muted">
            <Loader2 className="w-6 h-6 animate-spin text-primary" />
          </div>
        )}
        <div ref={divRef} className="w-full h-full" />
      </div>
      {lat != null && lng != null && (
        <p className="text-xs text-muted-foreground">
          Lat: {lat.toFixed(5)} • Lng: {lng.toFixed(5)}
        </p>
      )}
    </div>
  );
};

export default LocationPicker;
