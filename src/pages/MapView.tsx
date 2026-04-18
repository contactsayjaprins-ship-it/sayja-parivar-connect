import { useEffect, useMemo, useRef, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Loader2, Navigation, MapPin } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { fetchAllProfiles } from '@/lib/api';
import { FamilyProfile } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// @ts-expect-error reset
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: markerIcon2x,
  iconUrl: markerIcon,
  shadowUrl: markerShadow,
});

const DEFAULT_CENTER: [number, number] = [22.3072, 73.1812];

const distanceKm = (a: { lat: number; lng: number }, b: { lat: number; lng: number }) => {
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const aa =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((a.lat * Math.PI) / 180) * Math.cos((b.lat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(aa), Math.sqrt(1 - aa));
};

const MapView = () => {
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [village, setVillage] = useState('');
  const [search, setSearch] = useState('');
  const [radius, setRadius] = useState<number>(0); // 0 = off
  const [myLoc, setMyLoc] = useState<{ lat: number; lng: number } | null>(null);
  const mapDiv = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);
  const markersRef = useRef<L.Marker[]>([]);
  const radiusCircleRef = useRef<L.Circle | null>(null);

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

  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return profiles.filter(p => {
      if (p.lat == null || p.lng == null) return false;
      if (village && p.nativeVillage !== village) return false;
      if (q && !(
        p.name.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        (p.nativeVillage || '').toLowerCase().includes(q)
      )) return false;
      if (radius > 0 && myLoc) {
        const d = distanceKm(myLoc, { lat: p.lat as number, lng: p.lng as number });
        if (d > radius) return false;
      }
      return true;
    });
  }, [profiles, village, search, radius, myLoc]);

  // Init map
  useEffect(() => {
    if (!mapDiv.current || mapRef.current) return;
    const map = L.map(mapDiv.current).setView(DEFAULT_CENTER, 7);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap',
      maxZoom: 19,
    }).addTo(map);
    mapRef.current = map;
    return () => { map.remove(); mapRef.current = null; };
  }, []);

  // Render markers
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    markersRef.current.forEach(m => m.remove());
    markersRef.current = [];

    visible.forEach(p => {
      const html = `
        <div style="min-width:220px;font-family:'Noto Sans Gujarati',sans-serif;">
          ${p.housePhoto ? `<img src="${p.housePhoto}" style="width:100%;height:100px;object-fit:cover;border-radius:8px;margin-bottom:8px;" />` : ''}
          <div style="font-weight:700;font-size:14px;">${p.name} ${p.surname || ''}</div>
          <div style="font-size:12px;color:#475569;">📞 ${p.mobile}</div>
          <div style="font-size:12px;color:#475569;">📍 ${p.address || p.nativeVillage}</div>
          <div style="margin-top:8px;display:flex;gap:6px;flex-wrap:wrap;">
            <a href="tel:${p.mobile}" style="color:#ea580c;font-weight:600;font-size:12px;">📞 કૉલ</a>
            <a href="https://wa.me/91${p.mobile.replace(/\D/g, '').slice(-10)}" target="_blank" rel="noopener" style="color:#16a34a;font-weight:600;font-size:12px;">💬 WhatsApp</a>
            <a href="https://www.google.com/maps/dir/?api=1&destination=${p.lat},${p.lng}" target="_blank" rel="noopener" style="color:#2563eb;font-weight:600;font-size:12px;">🧭 નકશે જાવ</a>
          </div>
        </div>`;
      const marker = L.marker([p.lat as number, p.lng as number]).addTo(map).bindPopup(html);
      markersRef.current.push(marker);
    });

    if (visible.length > 0) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.2));
      if (visible.length === 1) map.setZoom(15);
    }
  }, [visible]);

  // Radius circle
  useEffect(() => {
    const map = mapRef.current;
    if (!map) return;
    radiusCircleRef.current?.remove();
    radiusCircleRef.current = null;
    if (myLoc && radius > 0) {
      radiusCircleRef.current = L.circle([myLoc.lat, myLoc.lng], {
        radius: radius * 1000,
        color: '#ea580c',
        fillColor: '#fed7aa',
        fillOpacity: 0.2,
      }).addTo(map);
      L.marker([myLoc.lat, myLoc.lng]).addTo(map).bindPopup('તમે અહીં છો');
    }
  }, [myLoc, radius]);

  const requestMyLocation = () => {
    if (!navigator.geolocation) {
      toast({ title: 'Geolocation supported નથી', variant: 'destructive' });
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (pos) => setMyLoc({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => toast({ title: 'લોકેશન મળ્યું નહીં', variant: 'destructive' }),
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-4">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">🗺️ પરિવાર નકશો</h1>
          <p className="text-muted-foreground text-sm mt-1">દરેક પરિવારનું લોકેશન જુઓ • OpenStreetMap (free)</p>
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          <Input
            placeholder="🔍 શોધો..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 min-w-[180px] max-w-xs"
          />
          <select
            value={village}
            onChange={e => setVillage(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value="">બધા ગામ ({visible.length})</option>
            {villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select
            value={radius}
            onChange={e => setRadius(Number(e.target.value))}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm"
          >
            <option value={0}>📍 રેડિયસ બંધ</option>
            <option value={5}>5 km</option>
            <option value={10}>10 km</option>
            <option value={25}>25 km</option>
            <option value={50}>50 km</option>
          </select>
          <Button type="button" size="sm" variant="outline" onClick={requestMyLocation}>
            <MapPin className="w-4 h-4 mr-1" /> મારું લોકેશન
          </Button>
        </div>

        <div className="relative w-full h-[70vh] rounded-2xl overflow-hidden border border-border shadow-card">
          {loading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted z-[1000]">
              <Loader2 className="w-8 h-8 animate-spin text-primary" />
            </div>
          )}
          <div ref={mapDiv} className="w-full h-full z-0" />
        </div>

        {!loading && profiles.length > 0 && visible.length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            કોઈ પરિવાર મળ્યો નહીં. પ્રોફાઇલ ફોર્મમાં નકશા પર પિન મૂકો.
          </p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default MapView;
