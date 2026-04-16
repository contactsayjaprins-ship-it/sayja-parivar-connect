import { useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { uploadPhoto } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

interface Props {
  value?: string;
  onChange: (url: string) => void;
  prefix: string;
  size?: 'sm' | 'lg';
  label?: string;
}

const PhotoUpload = ({ value, onChange, prefix, size = 'sm', label = '📷 ફોટો' }: Props) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [loading, setLoading] = useState(false);

  const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setLoading(true);
    try {
      const url = await uploadPhoto(file, prefix);
      onChange(url);
      toast({ title: 'સફળતા', description: 'ફોટો અપલોડ થયો!' });
    } catch (err: any) {
      toast({ title: 'ભૂલ', description: err.message || 'અપલોડ ફેઇલ', variant: 'destructive' });
    } finally {
      setLoading(false);
      if (inputRef.current) inputRef.current.value = '';
    }
  };

  const dim = size === 'lg' ? 'w-24 h-24' : 'w-12 h-12';

  return (
    <div className="flex items-center gap-3">
      {value ? (
        <img src={value} alt="upload" className={`${dim} rounded-full object-cover border-2 border-primary`} />
      ) : (
        <div className={`${dim} rounded-full bg-muted flex items-center justify-center text-muted-foreground text-xs`}>
          {size === 'lg' ? '📷' : '?'}
        </div>
      )}
      <div className="flex-1 space-y-1">
        <span className="text-xs text-muted-foreground block">{label}</span>
        <Input
          ref={inputRef}
          type="file"
          accept="image/*"
          capture="environment"
          onChange={handleFile}
          disabled={loading}
          className="text-xs h-9"
        />
      </div>
      {loading && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
      {value && !loading && (
        <Button type="button" variant="ghost" size="sm" onClick={() => onChange('')} className="text-destructive">✕</Button>
      )}
    </div>
  );
};

export default PhotoUpload;
