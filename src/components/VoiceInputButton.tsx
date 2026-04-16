import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { toast } from '@/hooks/use-toast';

interface Props {
  onTranscript: (text: string) => void;
  label?: string;
}

const VoiceInputButton = ({ onTranscript, label }: Props) => {
  const { listening, supported, start, stop } = useVoiceInput(onTranscript);

  if (!supported) return null;

  const handleClick = () => {
    if (listening) { stop(); return; }
    toast({ title: '🎤 બોલો...', description: 'ગુજરાતીમાં બોલો' });
    start();
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      variant={listening ? 'destructive' : 'outline'}
      size="sm"
      className="gap-2"
    >
      {listening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
      {label || (listening ? 'રોકો' : '🎤 બોલો')}
    </Button>
  );
};

export default VoiceInputButton;
