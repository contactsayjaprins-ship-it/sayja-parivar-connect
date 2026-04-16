import { FamilyMember } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoUpload from './PhotoUpload';
import VoiceInputButton from './VoiceInputButton';
import { parseMemberSentence } from '@/lib/ocrParser';
import { toast } from '@/hooks/use-toast';

interface Props {
  members: FamilyMember[];
  onChange: (members: FamilyMember[]) => void;
}

const emptyMember = (): FamilyMember => ({
  id: crypto.randomUUID(),
  name: '',
  relation: '',
  occupation: '',
  education: '',
  mobile: '',
  gender: 'પુરુષ',
  photo: '',
});

const FamilyMemberForm = ({ members, onChange }: Props) => {
  const addMember = () => onChange([...members, emptyMember()]);

  const updateMember = (id: string, field: keyof FamilyMember, value: string) => {
    onChange(members.map(m => (m.id === id ? { ...m, [field]: value } : m)));
  };

  const updateMemberFields = (id: string, patch: Partial<FamilyMember>) => {
    onChange(members.map(m => (m.id === id ? { ...m, ...patch } : m)));
  };

  const removeMember = (id: string) => onChange(members.filter(m => m.id !== id));

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <h3 className="text-lg font-semibold">👨‍👩‍👧 પરિવારના સભ્યો</h3>
        <Button type="button" onClick={addMember} size="sm" className="gradient-primary text-primary-foreground border-0">
          ➕ સભ્ય ઉમેરો
        </Button>
      </div>
      <AnimatePresence>
        {members.map((member, idx) => (
          <motion.div
            key={member.id}
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="bg-secondary/50 rounded-xl p-4 space-y-3 border border-border"
          >
            <div className="flex justify-between items-center flex-wrap gap-2">
              <span className="font-medium text-sm text-muted-foreground">સભ્ય {idx + 1}</span>
              <div className="flex items-center gap-2">
                <VoiceInputButton
                  label="🎤 બોલીને ભરો"
                  onTranscript={(text) => {
                    const patch = parseMemberSentence(text);
                    if (Object.keys(patch).length === 0) {
                      toast({ title: 'સૂચના', description: 'કોઈ ફીલ્ડ મળ્યું નહીં', variant: 'destructive' });
                      return;
                    }
                    updateMemberFields(member.id, patch as Partial<FamilyMember>);
                    toast({ title: `🎤 સભ્ય ${idx + 1} ભર્યું`, description: text });
                  }}
                />
                <Button type="button" variant="ghost" size="sm" onClick={() => removeMember(member.id)} className="text-destructive">
                  ✕
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div><Label>નામ</Label><Input value={member.name} onChange={e => updateMember(member.id, 'name', e.target.value)} /></div>
              <div><Label>સંબંધ</Label><Input value={member.relation} onChange={e => updateMember(member.id, 'relation', e.target.value)} /></div>
              <div><Label>વ્યવસાય</Label><Input value={member.occupation} onChange={e => updateMember(member.id, 'occupation', e.target.value)} /></div>
              <div><Label>ભણતર</Label><Input value={member.education} onChange={e => updateMember(member.id, 'education', e.target.value)} /></div>
              <div><Label>મોબાઇલ</Label><Input value={member.mobile} onChange={e => updateMember(member.id, 'mobile', e.target.value)} /></div>
              <div>
                <Label>લિંગ</Label>
                <Select value={member.gender} onValueChange={v => updateMember(member.id, 'gender', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="પુરુષ">પુરુષ</SelectItem>
                    <SelectItem value="સ્ત્રી">સ્ત્રી</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <PhotoUpload
              value={member.photo}
              onChange={url => updateMember(member.id, 'photo', url)}
              prefix={`members/${member.id}`}
              label="📷 સભ્યનો ફોટો"
            />
          </motion.div>
        ))}
      </AnimatePresence>
      {members.length === 0 && (
        <p className="text-sm text-muted-foreground text-center py-4">કોઈ સભ્ય ઉમેર્યો નથી. ઉપર ➕ બટન દબાવી સભ્ય ઉમેરો.</p>
      )}
    </div>
  );
};

export default FamilyMemberForm;
