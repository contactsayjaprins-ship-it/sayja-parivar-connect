import { Button } from '@/components/ui/button';
import { Mic, MicOff } from 'lucide-react';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { toast } from '@/hooks/use-toast';

interface Props {
  onTranscript: (text: string) => void;
  title?: string;
}

/** Compact mic button to attach next to a single input field. */
const MicButton = ({ onTranscript, title }: Props) => {
  const { listening, supported, start, stop } = useVoiceInput(onTranscript);
  if (!supported) return null;

  const handleClick = () => {
    if (listening) { stop(); return; }
    toast({ title: '🎤 બોલો...', description: title || 'ગુજરાતીમાં બોલો' });
    start();
  };

  return (
    <Button
      type="button"
      onClick={handleClick}
      variant={listening ? 'destructive' : 'outline'}
      size="icon"
      className="h-9 w-9 shrink-0"
      title={title || 'Voice input'}
      aria-label={title || 'Voice input'}
    >
      {listening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
    </Button>
  );
};

export default MicButton;
