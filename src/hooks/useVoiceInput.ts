import { useEffect, useRef, useState } from 'react';

// Web Speech API typings (browser provides them)
type SR = any;

export const useVoiceInput = (onResult: (text: string) => void, lang = 'gu-IN') => {
  const recRef = useRef<SR | null>(null);
  const [listening, setListening] = useState(false);
  const [supported, setSupported] = useState(true);

  useEffect(() => {
    const SpeechRecognition: any =
      (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) { setSupported(false); return; }
    const rec = new SpeechRecognition();
    rec.lang = lang;
    rec.continuous = false;
    rec.interimResults = false;
    rec.onresult = (e: any) => {
      const text = Array.from(e.results).map((r: any) => r[0].transcript).join(' ').trim();
      if (text) onResult(text);
    };
    rec.onend = () => setListening(false);
    rec.onerror = () => setListening(false);
    recRef.current = rec;
    return () => { try { rec.abort(); } catch {} };
  }, [lang, onResult]);

  const start = () => {
    if (!recRef.current || listening) return;
    try { recRef.current.start(); setListening(true); } catch {}
  };
  const stop = () => { try { recRef.current?.stop(); } catch {} setListening(false); };

  return { listening, supported, start, stop };
};
