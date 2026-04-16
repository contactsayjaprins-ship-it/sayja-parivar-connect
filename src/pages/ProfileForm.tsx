import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, FamilyProfile } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FamilyMemberForm from '@/components/FamilyMemberForm';
import { toast } from '@/hooks/use-toast';

const ProfileForm = () => {
  const { currentUser, updateProfile } = useAppStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<FamilyProfile | null>(null);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    setForm({ ...currentUser });
  }, [currentUser, navigate]);

  if (!form) return null;

  const update = (field: keyof FamilyProfile, value: string | number) => {
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleSave = () => {
    if (!form.name.trim()) {
      toast({ title: 'ભૂલ', description: 'કૃપા કરી નામ દાખલ કરો', variant: 'destructive' });
      return;
    }
    updateProfile(form);
    toast({ title: 'સફળતા', description: 'માહિતી સાચવી!' });
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
          <h1 className="text-2xl font-bold text-center">🧾 પરિવાર માહિતી</h1>

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

          <Button onClick={handleSave} className="w-full gradient-primary text-primary-foreground border-0 text-lg py-6">
            💾 માહિતી સાચવો
          </Button>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileForm;
