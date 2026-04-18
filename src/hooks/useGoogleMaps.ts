import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';

let cachedKey: string | null = null;
let loadPromise: Promise<void> | null = null;

const fetchKey = async (): Promise<string> => {
  if (cachedKey) return cachedKey;
  const { data, error } = await supabase.functions.invoke('get-maps-key');
  if (error) throw error;
  cachedKey = (data as any)?.key || '';
  return cachedKey;
};

const loadScript = (key: string): Promise<void> => {
  if (typeof window === 'undefined') return Promise.resolve();
  if ((window as any).google?.maps) return Promise.resolve();
  if (loadPromise) return loadPromise;
  loadPromise = new Promise((resolve, reject) => {
    const existing = document.getElementById('google-maps-js') as HTMLScriptElement | null;
    if (existing) {
      existing.addEventListener('load', () => resolve());
      existing.addEventListener('error', () => reject(new Error('Maps load failed')));
      return;
    }
    const s = document.createElement('script');
    s.id = 'google-maps-js';
    s.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(key)}&libraries=marker`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error('Maps load failed'));
    document.head.appendChild(s);
  });
  return loadPromise;
};

export const useGoogleMaps = () => {
  const [ready, setReady] = useState<boolean>(!!(typeof window !== 'undefined' && (window as any).google?.maps));
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const key = await fetchKey();
        if (!key) throw new Error('Google Maps API key નથી. એડમિન સેટિંગ્સમાં ઉમેરો.');
        await loadScript(key);
        if (alive) setReady(true);
      } catch (e: any) {
        if (alive) setError(e.message || 'Maps load failed');
      }
    })();
    return () => { alive = false; };
  }, []);

  return { ready, error };
};
