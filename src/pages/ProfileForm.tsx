import { useEffect, useState } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAppStore, FamilyProfile, FamilyMember } from '@/lib/store';
import { saveProfile } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FamilyMemberForm from '@/components/FamilyMemberForm';
import PhotoUpload from '@/components/PhotoUpload';
import VoiceInputButton from '@/components/VoiceInputButton';
import MicButton from '@/components/MicButton';
import { parseOcrText, parseMembersVoice } from '@/lib/ocrParser';
import { toast } from '@/hooks/use-toast';
import { Loader2, Camera } from 'lucide-react';

const ProfileForm = () => {
  const { currentUser, setCurrentUser } = useAppStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState<FamilyProfile | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    const prefilled = (location.state as any)?.prefilled;
    setForm({ ...currentUser, ...(prefilled || {}) });
  }, [currentUser, navigate, location.state]);

  if (!form) return null;

  const update = (field: keyof FamilyProfile, value: string | number) => {
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  // Apply parsed voice/OCR text to main fields + members (by index)
  const applyParsedText = (text: string) => {
    const parsed = parseOcrText(text);
    setForm(prev => {
      if (!prev) return prev;
      const next: FamilyProfile = {
        ...prev,
        name: parsed.name || prev.name,
        nativeVillage: parsed.nativeVillage || prev.nativeVillage,
        currentVillage: parsed.currentVillage || prev.currentVillage,
        occupation: parsed.occupation || prev.occupation,
        education: parsed.education || prev.education,
        address: parsed.address || prev.address,
        email: parsed.email || prev.email,
        totalMembers: parsed.totalMembers || prev.totalMembers,
        members: [...prev.members],
      };

      // Member voice segments → patch by index
      const voiceMembers = parseMembersVoice(text);
      voiceMembers.forEach(({ index, data }) => {
        while (next.members.length <= index) {
          next.members.push({
            id: crypto.randomUUID(),
            name: '', relation: '', occupation: '', education: '', mobile: '', gender: 'પુરુષ', photo: '',
          });
        }
        next.members[index] = { ...next.members[index], ...data } as FamilyMember;
      });

      return next;
    });
  };

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'ભૂલ', description: 'કૃપા કરી નામ દાખલ કરો', variant: 'destructive' });
      return;
    }
    if (!form.mobile.trim()) {
      toast({ title: 'ભૂલ', description: 'મોબાઇલ નંબર જરૂરી છે', variant: 'destructive' });
      return;
    }
    // Drop blank members (no name AND no relation AND no mobile)
    const cleanedMembers = form.members.filter(m =>
      m.name.trim() || m.relation.trim() || m.mobile.trim()
    );
    const invalidMember = cleanedMembers.find(m => !m.name.trim());
    if (invalidMember) {
      toast({ title: 'ભૂલ', description: 'દરેક સભ્યનું નામ જરૂરી છે', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const saved = await saveProfile({ ...form, members: cleanedMembers });
      setCurrentUser(saved);
      setForm(saved);
      toast({ title: 'સફળતા', description: `માહિતી સાચવી! (${saved.members.length} સભ્યો)` });
    } catch (err: any) {
      toast({ title: 'ભૂલ', description: err.message || 'સેવ ફેઇલ', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-3xl mx-auto bg-card rounded-2xl shadow-card border border-border p-6 sm:p-8 space-y-6"
        >
          <div className="flex flex-col gap-3">
            <h1 className="text-2xl font-bold">🧾 પરિવાર માહિતી</h1>
            <div className="flex flex-wrap gap-2">
              <Link to="/ocr">
                <Button type="button" variant="outline" size="sm" className="gap-2">
                  <Camera className="w-4 h-4" />
                  📷 ફોર્મનો ફોટો અપલોડ કરો
                </Button>
              </Link>
              <VoiceInputButton
                onTranscript={(text) => {
                  applyParsedText(text);
                  toast({ title: '🎤 ભર્યું', description: text });
                }}
                label="🎤 બોલીને ભરો"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              ટિપ: સભ્યો માટે બોલો — "સભ્ય 1 નામ રમેશ, સંબંધ પિતા, વ્યવસાય ખેતી, ભણતર 10, મોબાઇલ 9876543210, લિંગ પુરુષ"
            </p>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 border border-border">
            <PhotoUpload
              value={form.profilePhoto}
              onChange={url => update('profilePhoto', url)}
              prefix={`profiles/${form.id}`}
              size="lg"
              label="📷 પ્રોફાઇલ ફોટો"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <Label>નામ *</Label>
              <div className="flex gap-2">
                <Input value={form.name} onChange={e => update('name', e.target.value)} />
                <MicButton title="નામ" onTranscript={(t) => update('name', t)} />
              </div>
            </div>
            <div><Label>મોબાઇલ નંબર</Label><Input value={form.mobile} disabled className="bg-muted" /></div>
            <div><Label>Email ID</Label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
            <div>
              <Label>મૂળ ગામ</Label>
              <div className="flex gap-2">
                <Input value={form.nativeVillage} onChange={e => update('nativeVillage', e.target.value)} />
                <MicButton title="મૂળ ગામ" onTranscript={(t) => update('nativeVillage', t)} />
              </div>
            </div>
            <div>
              <Label>હાલ ગામ</Label>
              <div className="flex gap-2">
                <Input value={form.currentVillage} onChange={e => update('currentVillage', e.target.value)} />
                <MicButton title="હાલ ગામ" onTranscript={(t) => update('currentVillage', t)} />
              </div>
            </div>
            <div>
              <Label>વ્યવસાય</Label>
              <div className="flex gap-2">
                <Input value={form.occupation} onChange={e => update('occupation', e.target.value)} />
                <MicButton title="વ્યવસાય" onTranscript={(t) => update('occupation', t)} />
              </div>
            </div>
            <div>
              <Label>ભણતર</Label>
              <div className="flex gap-2">
                <Input value={form.education} onChange={e => update('education', e.target.value)} />
                <MicButton title="ભણતર" onTranscript={(t) => update('education', t)} />
              </div>
            </div>
            <div><Label>ઘરનાં કુલ સભ્ય</Label><Input type="number" min={1} value={form.totalMembers} onChange={e => update('totalMembers', parseInt(e.target.value) || 1)} /></div>
          </div>
          <div>
            <Label>એડ્રેસ</Label>
            <div className="flex gap-2">
              <Textarea value={form.address} onChange={e => update('address', e.target.value)} rows={3} />
              <MicButton title="એડ્રેસ" onTranscript={(t) => update('address', t)} />
            </div>
          </div>

          <FamilyMemberForm
            members={form.members}
            onChange={members => setForm(prev => prev ? { ...prev, members } : prev)}
          />

          <Button onClick={handleSave} disabled={saving} className="w-full gradient-primary text-primary-foreground border-0 text-lg py-6">
            {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : '💾 માહિતી સાચવો'}
          </Button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileForm;
