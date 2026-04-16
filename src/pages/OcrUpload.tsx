import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/hooks/use-toast';
import { Progress } from '@/components/ui/progress';
import { parseOcrText } from '@/lib/ocrParser';
import { useAppStore } from '@/lib/store';
import { loginByMobile } from '@/lib/api';

// Image preprocessing: grayscale + contrast boost on a canvas
const preprocess = (dataUrl: string): Promise<string> =>
  new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      const maxW = 1600;
      const scale = Math.min(1, maxW / img.width);
      canvas.width = img.width * scale;
      canvas.height = img.height * scale;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
      const data = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const d = data.data;
      const contrast = 1.4;
      const intercept = 128 * (1 - contrast);
      for (let i = 0; i < d.length; i += 4) {
        const gray = 0.299 * d[i] + 0.587 * d[i + 1] + 0.114 * d[i + 2];
        const c = Math.max(0, Math.min(255, gray * contrast + intercept));
        d[i] = d[i + 1] = d[i + 2] = c;
      }
      ctx.putImageData(data, 0, 0);
      resolve(canvas.toDataURL('image/jpeg', 0.92));
    };
    img.src = dataUrl;
  });

const OcrUpload = () => {
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [parsed, setParsed] = useState<ReturnType<typeof parseOcrText> | null>(null);
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();
  const { setCurrentUser } = useAppStore();

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => setImage(reader.result as string);
    reader.readAsDataURL(file);
  };

  const runOcr = async () => {
    if (!image) return;
    setLoading(true);
    setProgress(5);
    try {
      const processed = await preprocess(image);
      setProgress(20);
      const Tesseract = await import('tesseract.js');
      const result = await Tesseract.recognize(processed, 'guj+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(20 + Math.round(m.progress * 70));
          }
        },
      });
      setProgress(95);
      const text = result.data.text;
      setExtractedText(text);
      const parsedData = parseOcrText(text);
      setParsed(parsedData);
      setProgress(100);
      toast({ title: 'સફળતા', description: 'ડેટા એક્સ્ટ્રેક્ટ થયો!' });
    } catch (err: any) {
      toast({ title: 'ભૂલ', description: err.message || 'OCR ફેઇલ', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const useExtracted = async () => {
    if (!parsed) return;
    const mobile = (parsed as any).mobile;
    if (!mobile) {
      toast({ title: 'સૂચના', description: 'મોબાઇલ મળ્યો નહીં, લોગિનમાં દાખલ કરો', variant: 'destructive' });
      navigate('/login');
      return;
    }
    try {
      const profile = await loginByMobile(mobile);
      const merged = {
        ...profile,
        name: parsed.name || profile.name,
        email: parsed.email || profile.email,
        nativeVillage: parsed.nativeVillage || profile.nativeVillage,
        currentVillage: parsed.currentVillage || profile.currentVillage,
        occupation: parsed.occupation || profile.occupation,
        education: parsed.education || profile.education,
        totalMembers: parsed.totalMembers || profile.totalMembers,
        address: parsed.address || profile.address,
        members: parsed.members && parsed.members.length
          ? parsed.members.map(m => ({ ...m, id: crypto.randomUUID() }))
          : profile.members,
      };
      setCurrentUser(merged);
      navigate('/profile', { state: { prefilled: merged } });
    } catch (err: any) {
      toast({ title: 'ભૂલ', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto bg-card rounded-2xl shadow-card border border-border p-6 sm:p-8 space-y-6"
        >
          <h1 className="text-2xl font-bold text-center">📷 OCR - ફોર્મ ફોટો અપલોડ</h1>
          <p className="text-muted-foreground text-center text-sm">ગુજરાતી ફોર્મનો ફોટો અપલોડ કરો — ડેટા ઓટોમેટિક ફોર્મમાં ભરાશે</p>

          <div>
            <Label>ફોર્મ ફોટો અપલોડ કરો</Label>
            <Input type="file" accept="image/*" capture="environment" onChange={handleUpload} />
          </div>

          {image && (
            <div className="space-y-4">
              <img src={image} alt="uploaded" className="w-full rounded-lg border border-border max-h-80 object-contain" />
              <Button onClick={runOcr} disabled={loading} className="w-full gradient-primary text-primary-foreground border-0">
                {loading ? '🔄 પ્રોસેસિંગ...' : '🔍 ડેટા એક્સ્ટ્રેક્ટ કરો'}
              </Button>
              {loading && <Progress value={progress} />}
            </div>
          )}

          {parsed && (
            <div className="space-y-3 bg-secondary/40 rounded-xl p-4 border border-border">
              <h3 className="font-semibold">✅ એક્સ્ટ્રેક્ટ થયેલ ડેટા (પ્રીવ્યુ)</h3>
              <div className="text-sm space-y-1">
                {parsed.name && <p><b>નામ:</b> {parsed.name}</p>}
                {(parsed as any).mobile && <p><b>મોબાઇલ:</b> {(parsed as any).mobile}</p>}
                {parsed.nativeVillage && <p><b>મૂળ ગામ:</b> {parsed.nativeVillage}</p>}
                {parsed.currentVillage && <p><b>હાલ ગામ:</b> {parsed.currentVillage}</p>}
                {parsed.occupation && <p><b>વ્યવસાય:</b> {parsed.occupation}</p>}
                {parsed.education && <p><b>ભણતર:</b> {parsed.education}</p>}
                {parsed.address && <p><b>એડ્રેસ:</b> {parsed.address}</p>}
                {parsed.members && parsed.members.length > 0 && (
                  <p><b>સભ્યો મળ્યા:</b> {parsed.members.length}</p>
                )}
              </div>
              <Button onClick={useExtracted} className="w-full gradient-primary text-primary-foreground border-0">
                📝 ફોર્મમાં ભરો અને એડિટ કરો
              </Button>
            </div>
          )}

          {extractedText && (
            <details className="space-y-2">
              <summary className="cursor-pointer text-sm text-muted-foreground">🔍 રો OCR ટેક્સ્ટ જુઓ</summary>
              <pre className="bg-muted rounded-lg p-4 text-xs whitespace-pre-wrap max-h-60 overflow-y-auto mt-2">
                {extractedText}
              </pre>
            </details>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default OcrUpload;
