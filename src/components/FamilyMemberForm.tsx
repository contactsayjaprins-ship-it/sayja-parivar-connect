import { FamilyMember } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { motion, AnimatePresence } from 'framer-motion';
import PhotoUpload from './PhotoUpload';
import MicButton from './MicButton';
import { RELATION_OPTIONS, normalizeRelation } from '@/lib/relations';
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
  govJob: 'No',
  govJobPlace: '',
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
                <Button type="button" variant="ghost" size="sm" onClick={() => removeMember(member.id)} className="text-destructive">
                  ✕
                </Button>
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <Label>નામ</Label>
                <div className="flex gap-2">
                  <Input value={member.name} onChange={e => updateMember(member.id, 'name', e.target.value)} />
                  <MicButton title="નામ" onTranscript={(t) => updateMember(member.id, 'name', t)} />
                </div>
              </div>
              <div>
                <Label>સંબંધ</Label>
                <div className="flex gap-2">
                  <Select
                    value={RELATION_OPTIONS.includes(member.relation as any) ? member.relation : (member.relation ? 'અન્ય' : '')}
                    onValueChange={v => updateMember(member.id, 'relation', v)}
                  >
                    <SelectTrigger><SelectValue placeholder="સંબંધ પસંદ કરો" /></SelectTrigger>
                    <SelectContent>
                      {RELATION_OPTIONS.map(r => (
                        <SelectItem key={r} value={r}>{r}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <MicButton
                    title="સંબંધ"
                    onTranscript={(t) => {
                      const rel = normalizeRelation(t);
                      updateMember(member.id, 'relation', rel || t);
                    }}
                  />
                </div>
              </div>
              <div>
                <Label>વ્યવસાય</Label>
                <div className="flex gap-2">
                  <Input value={member.occupation} onChange={e => updateMember(member.id, 'occupation', e.target.value)} />
                  <MicButton title="વ્યવસાય" onTranscript={(t) => updateMember(member.id, 'occupation', t)} />
                </div>
              </div>
              <div>
                <Label>સરકારી નોકરી છે?</Label>
                <Select value={member.govJob} onValueChange={v => updateMember(member.id, 'govJob', v)}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="No">ના</SelectItem>
                    <SelectItem value="Yes">હા</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {member.govJob === 'Yes' && (
                <div className="sm:col-span-2">
                  <Label>કઈ જગ્યા / વિભાગ?</Label>
                  <div className="flex gap-2">
                    <Input value={member.govJobPlace} onChange={e => updateMember(member.id, 'govJobPlace', e.target.value)} />
                    <MicButton title="જગ્યા" onTranscript={(t) => updateMember(member.id, 'govJobPlace', t)} />
                  </div>
                </div>
              )}
              <div>
                <Label>ભણતર</Label>
                <div className="flex gap-2">
                  <Input value={member.education} onChange={e => updateMember(member.id, 'education', e.target.value)} />
                  <MicButton title="ભણતર" onTranscript={(t) => updateMember(member.id, 'education', t)} />
                </div>
              </div>
              <div>
                <Label>મોબાઇલ</Label>
                <div className="flex gap-2">
                  <Input value={member.mobile} onChange={e => updateMember(member.id, 'mobile', e.target.value.replace(/\D/g, '').slice(0, 10))} />
                  <MicButton title="મોબાઇલ" onTranscript={(t) => updateMember(member.id, 'mobile', t.replace(/\D/g, '').slice(0, 10))} />
                </div>
              </div>
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
