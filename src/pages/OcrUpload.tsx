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

const OcrUpload = () => {
  const [image, setImage] = useState<string | null>(null);
  const [extractedText, setExtractedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [progress, setProgress] = useState(0);
  const navigate = useNavigate();

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
    setProgress(10);
    try {
      const Tesseract = await import('tesseract.js');
      setProgress(30);
      const result = await Tesseract.recognize(image, 'guj+eng', {
        logger: m => {
          if (m.status === 'recognizing text') {
            setProgress(30 + Math.round(m.progress * 60));
          }
        },
      });
      setProgress(100);
      setExtractedText(result.data.text);
      toast({ title: 'સફળતા', description: 'ટેક્સ્ટ એક્સ્ટ્રેક્ટ થયું!' });
    } catch {
      toast({ title: 'ભૂલ', description: 'OCR ફેઇલ થયું', variant: 'destructive' });
    } finally {
      setLoading(false);
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
          <p className="text-muted-foreground text-center text-sm">ગુજરાતી ફોર્મનો ફોટો અપલોડ કરો અને ડેટા ઓટોમેટિક ભરો</p>

          <div>
            <Label>ફોર્મ ફોટો અપલોડ કરો</Label>
            <Input type="file" accept="image/*" capture="environment" onChange={handleUpload} />
          </div>

          {image && (
            <div className="space-y-4">
              <img src={image} alt="uploaded" className="w-full rounded-lg border border-border max-h-80 object-contain" />
              <Button
                onClick={runOcr}
                disabled={loading}
                className="w-full gradient-primary text-primary-foreground border-0"
              >
                {loading ? '🔄 પ્રોસેસિંગ...' : '🔍 ટેક્સ્ટ એક્સ્ટ્રેક્ટ કરો'}
              </Button>
              {loading && <Progress value={progress} />}
            </div>
          )}

          {extractedText && (
            <div className="space-y-3">
              <Label>એક્સ્ટ્રેક્ટ થયેલ ટેક્સ્ટ:</Label>
              <pre className="bg-muted rounded-lg p-4 text-sm whitespace-pre-wrap max-h-60 overflow-y-auto">
                {extractedText}
              </pre>
              <div className="flex gap-3">
                <Button variant="outline" onClick={() => navigator.clipboard.writeText(extractedText)}>
                  📋 કોપી કરો
                </Button>
                <Button onClick={() => navigate('/login')} className="gradient-primary text-primary-foreground border-0">
                  📝 ફોર્મ ભરો
                </Button>
              </div>
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default OcrUpload;
