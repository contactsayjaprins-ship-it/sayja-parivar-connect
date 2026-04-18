import { useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader2, Phone, MessageCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { fetchAllProfiles } from '@/lib/api';
import { FamilyProfile } from '@/lib/store';
import { useGoogleMaps } from '@/hooks/useGoogleMaps';
import { toast } from '@/hooks/use-toast';
import { renderToStaticMarkup } from 'react-dom/server';

const DEFAULT_CENTER = { lat: 22.3072, lng: 73.1812 };

const MapView = () => {
  const { ready, error } = useGoogleMaps();
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [village, setVillage] = useState('');
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const infoRef = useRef<any>(null);

  useEffect(() => {
    (async () => {
      try {
        setProfiles(await fetchAllProfiles());
      } catch (err: any) {
        toast({ title: 'ભૂલ', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const villages = useMemo(
    () => Array.from(new Set(profiles.map(p => p.nativeVillage).filter(Boolean))).sort(),
    [profiles]
  );

  const visible = useMemo(
    () => profiles.filter(p => p.lat != null && p.lng != null && (!village || p.nativeVillage === village)),
    [profiles, village]
  );

  useEffect(() => {
    if (!ready || !mapDiv.current || mapRef.current) return;
    const g = (window as any).google;
    mapRef.current = new g.maps.Map(mapDiv.current, {
      center: DEFAULT_CENTER,
      zoom: 7,
      mapTypeControl: false,
      streetViewControl: false,
    });
    infoRef.current = new g.maps.InfoWindow();
  }, [ready]);

  useEffect(() => {
    if (!ready || !mapRef.current) return;
    const g = (window as any).google;
    markersRef.current.forEach(m => m.setMap(null));
    markersRef.current = [];

    const bounds = new g.maps.LatLngBounds();
    visible.forEach(p => {
      const pos = { lat: p.lat as number, lng: p.lng as number };
      const marker = new g.maps.Marker({
        position: pos,
        map: mapRef.current,
        title: p.name,
      });
      const html = renderToStaticMarkup(
        <div style={{ minWidth: 220, fontFamily: 'Noto Sans Gujarati, sans-serif' }}>
          {p.housePhoto && (
            <img src={p.housePhoto} alt="" style={{ width: '100%', height: 100, objectFit: 'cover', borderRadius: 8, marginBottom: 8 }} />
          )}
          <div style={{ fontWeight: 700, fontSize: 14 }}>{p.name} {p.surname}</div>
          <div style={{ fontSize: 12, color: '#475569' }}>📞 {p.mobile}</div>
          <div style={{ fontSize: 12, color: '#475569' }}>📍 {p.address || p.nativeVillage}</div>
          <div style={{ marginTop: 6 }}>
            <a href={`tel:${p.mobile}`} style={{ marginRight: 6, color: '#ea580c', fontWeight: 600, fontSize: 12 }}>કૉલ</a>
            <a href={`https://wa.me/91${p.mobile.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer" style={{ color: '#16a34a', fontWeight: 600, fontSize: 12 }}>WhatsApp</a>
          </div>
        </div>
      );
      marker.addListener('click', () => {
        infoRef.current.setContent(html);
        infoRef.current.open(mapRef.current, marker);
      });
      markersRef.current.push(marker);
      bounds.extend(pos);
    });

    if (visible.length > 0) {
      mapRef.current.fitBounds(bounds);
      if (visible.length === 1) mapRef.current.setZoom(15);
    }
  }, [visible, ready]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">🗺️ પરિવાર નકશો</h1>
            <p className="text-muted-foreground text-sm mt-1">દરેક પરિવારનું લોકેશન જુઓ</p>
          </div>
          <select
            value={village}
            onChange={e => setVillage(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">બધા ગામ ({visible.length})</option>
            {villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        {error && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            નકશો લોડ થઈ શક્યો નહીં: {error}
          </div>
        )}

        <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden border border-border shadow-card">
          {(!ready || loading) && !error && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-10">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <div ref={mapDiv} className="w-full h-full" />
        </div>

        {!loading && profiles.length > 0 && visible.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            કોઈ પરિવારે હજી લોકેશન સેવ કર્યું નથી. પ્રોફાઇલ ફોર્મમાં નકશા પર પિન મૂકો.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MapView;
