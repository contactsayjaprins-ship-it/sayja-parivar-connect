import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAppStore, FamilyProfile } from '@/lib/store';
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
import { parseOcrText } from '@/lib/ocrParser';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

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

  const handleSave = async () => {
    if (!form.name.trim()) {
      toast({ title: 'ભૂલ', description: 'કૃપા કરી નામ દાખલ કરો', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      const saved = await saveProfile(form);
      setCurrentUser(saved);
      setForm(saved);
      toast({ title: 'સફળતા', description: 'માહિતી સાચવી!' });
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
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <h1 className="text-2xl font-bold">🧾 પરિવાર માહિતી</h1>
            <VoiceInputButton
              onTranscript={(text) => {
                const parsed = parseOcrText(text);
                setForm(prev => prev ? {
                  ...prev,
                  name: parsed.name || prev.name,
                  nativeVillage: parsed.nativeVillage || prev.nativeVillage,
                  currentVillage: parsed.currentVillage || prev.currentVillage,
                  occupation: parsed.occupation || prev.occupation,
                  education: parsed.education || prev.education,
                  address: parsed.address || prev.address,
                  email: parsed.email || prev.email,
                } : prev);
                toast({ title: '🎤 ભર્યું', description: text });
              }}
              label="🎤 બોલીને ભરો"
            />
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
            <div><Label>નામ *</Label><Input value={form.name} onChange={e => update('name', e.target.value)} /></div>
            <div><Label>મોબાઇલ નંબર</Label><Input value={form.mobile} disabled className="bg-muted" /></div>
            <div><Label>Email ID</Label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
            <div><Label>મૂળ ગામ</Label><Input value={form.nativeVillage} onChange={e => update('nativeVillage', e.target.value)} /></div>
            <div><Label>હાલ ગામ</Label><Input value={form.currentVillage} onChange={e => update('currentVillage', e.target.value)} /></div>
            <div><Label>વ્યવસાય</Label><Input value={form.occupation} onChange={e => update('occupation', e.target.value)} /></div>
            <div><Label>ભણતર</Label><Input value={form.education} onChange={e => update('education', e.target.value)} /></div>
            <div><Label>ઘરનાં કુલ સભ્ય</Label><Input type="number" min={1} value={form.totalMembers} onChange={e => update('totalMembers', parseInt(e.target.value) || 1)} /></div>
          </div>
          <div><Label>એડ્રેસ</Label><Textarea value={form.address} onChange={e => update('address', e.target.value)} rows={3} /></div>

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
