import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, FamilyProfile, DEFAULT_SURNAME, CATEGORY_TAGS, BLOOD_GROUPS } from '@/lib/store';
import { saveProfile, uploadGalleryPhoto } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import FamilyMemberForm from '@/components/FamilyMemberForm';
import PhotoUpload from '@/components/PhotoUpload';
import MicButton from '@/components/MicButton';
import LocationPicker from '@/components/LocationPicker';
import DocumentUpload from '@/components/DocumentUpload';
import { toast } from '@/hooks/use-toast';
import { Loader2, X } from 'lucide-react';
import { generateAndDownloadPdf } from '@/lib/pdfGenerator';

const ProfileForm = () => {
  const { currentUser, setCurrentUser } = useAppStore();
  const navigate = useNavigate();
  const [form, setForm] = useState<FamilyProfile | null>(null);
  const [saving, setSaving] = useState(false);
  const [uploadingGallery, setUploadingGallery] = useState(false);

  useEffect(() => {
    if (!currentUser) { navigate('/login'); return; }
    setForm({ ...currentUser, surname: currentUser.surname || DEFAULT_SURNAME });
  }, [currentUser, navigate]);

  if (!form) return null;

  const update = (field: keyof FamilyProfile, value: any) => {
    setForm(prev => prev ? { ...prev, [field]: value } : prev);
  };

  const handleGalleryUpload = async (files: FileList | null) => {
    if (!files || files.length === 0 || !form) return;
    setUploadingGallery(true);
    try {
      const urls: string[] = [];
      for (const f of Array.from(files)) {
        urls.push(await uploadGalleryPhoto(f, `gallery/${form.id}`));
      }
      update('gallery', [...(form.gallery || []), ...urls]);
      toast({ title: '✅ ગેલેરી અપડેટ' });
    } catch (e: any) {
      toast({ title: 'ભૂલ', description: e.message, variant: 'destructive' });
    } finally {
      setUploadingGallery(false);
    }
  };

  const removeGalleryItem = (i: number) => {
    if (!form) return;
    update('gallery', (form.gallery || []).filter((_, idx) => idx !== i));
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
      toast({ title: '✅ સફળતા', description: 'માહિતી સાચવી! PDF બની રહ્યું છે...' });
      try {
        await generateAndDownloadPdf(saved);
        toast({ title: '📄 PDF તૈયાર', description: 'ડાઉનલોડ શરૂ થઈ ગયું' });
      } catch (e: any) {
        toast({ title: 'PDF ભૂલ', description: e.message, variant: 'destructive' });
      }
    } catch (err: any) {
      toast({ title: 'ભૂલ', description: err.message || 'સેવ ફેઇલ', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleDownloadAgain = async () => {
    try { await generateAndDownloadPdf(form); } catch (e: any) {
      toast({ title: 'ભૂલ', description: e.message, variant: 'destructive' });
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
          <div className="flex flex-col gap-2">
            <h1 className="text-2xl font-bold">🧾 પરિવાર માહિતી</h1>
            {form.familyCode && <p className="text-sm text-primary font-semibold">Family Code: {form.familyCode}</p>}
            <p className="text-xs text-muted-foreground">ટિપ: દરેક ફીલ્ડની બાજુમાં 🎤 બટન દબાવી બોલીને ભરી શકો છો.</p>
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 border border-border">
            <PhotoUpload
              value={form.profilePhoto}
              onChange={url => update('profilePhoto', url)}
              prefix={`profiles/${form.id}`}
              size="lg"
              label="📷 પ્રોફાઇલ ફોટો (મુખ્ય વ્યક્તિ)"
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
            <div><Label>અટક</Label><Input value={form.surname} onChange={e => update('surname', e.target.value)} placeholder="સાયજા" /></div>
            <div><Label>મોબાઇલ નંબર</Label><Input value={form.mobile} disabled className="bg-muted" /></div>
            <div><Label>Email</Label><Input type="email" value={form.email} onChange={e => update('email', e.target.value)} /></div>
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
              <Label>કેટેગરી</Label>
              <select value={form.categoryTag || ''} onChange={e => update('categoryTag', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">પસંદ કરો</option>
                {CATEGORY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
              </select>
            </div>
            <div>
              <Label>સરકારી નોકરી છે?</Label>
              <select value={form.govJob || 'No'} onChange={e => update('govJob', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="No">ના</option>
                <option value="Yes">હા</option>
              </select>
            </div>
            <div>
              <Label>🩸 બ્લડ ગ્રુપ</Label>
              <select value={form.bloodGroup || ''} onChange={e => update('bloodGroup', e.target.value)}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">પસંદ કરો</option>
                {BLOOD_GROUPS.map(b => <option key={b} value={b}>{b}</option>)}
              </select>
            </div>
            {form.govJob === 'Yes' && (
              <div className="sm:col-span-2">
                <Label>કઈ જગ્યા / વિભાગ?</Label>
                <div className="flex gap-2">
                  <Input value={form.govJobPlace} onChange={e => update('govJobPlace', e.target.value)} />
                  <MicButton title="જગ્યા" onTranscript={(t) => update('govJobPlace', t)} />
                </div>
              </div>
            )}
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

          <div className="bg-secondary/50 rounded-xl p-4 border border-border space-y-4">
            <PhotoUpload
              value={form.housePhoto}
              onChange={url => update('housePhoto', url)}
              prefix={`houses/${form.id}`}
              size="lg"
              label="🏠 ઘરનો મુખ્ય ફોટો"
            />
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 border border-border space-y-3">
            <Label>🖼️ ઘર/પરિવાર ગેલેરી (બહુવિધ ફોટા)</Label>
            <input
              type="file"
              accept="image/*"
              multiple
              onChange={e => handleGalleryUpload(e.target.files)}
              className="block w-full text-sm file:mr-2 file:py-2 file:px-4 file:rounded-md file:border-0 file:bg-primary file:text-primary-foreground"
            />
            {uploadingGallery && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
            {(form.gallery || []).length > 0 && (
              <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                {(form.gallery || []).map((g, i) => (
                  <div key={i} className="relative group aspect-square">
                    <img src={g} alt="" className="w-full h-full object-cover rounded-md" />
                    <button
                      type="button"
                      onClick={() => removeGalleryItem(i)}
                      className="absolute top-1 right-1 bg-destructive text-destructive-foreground rounded-full p-1 opacity-0 group-hover:opacity-100"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 border border-border space-y-3">
            <Label>📍 ઘરનું લોકેશન (નકશા પર પિન મૂકો)</Label>
            <LocationPicker
              lat={form.lat ?? null}
              lng={form.lng ?? null}
              onChange={(lat, lng) => setForm(prev => prev ? { ...prev, lat, lng } : prev)}
            />
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 border border-border space-y-3">
            <Label>📦 દસ્તાવેજો (આધાર / સર્ટિફિકેટ — સુરક્ષિત)</Label>
            <DocumentUpload familyId={form.id} />
          </div>

          <div className="bg-secondary/50 rounded-xl p-4 border border-border">
            <PhotoUpload
              value={form.formPhoto}
              onChange={url => update('formPhoto', url)}
              prefix={`forms/${form.id}`}
              size="lg"
              label="📄 ભરેલા ફોર્મનો ફોટો (વૈકલ્પિક)"
            />
          </div>

          <div className="flex flex-col sm:flex-row gap-3">
            <Button onClick={handleSave} disabled={saving} className="flex-1 gradient-primary text-primary-foreground border-0 text-lg py-6">
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : '💾 સાચવો અને PDF ડાઉનલોડ'}
            </Button>
            <Button type="button" variant="outline" onClick={handleDownloadAgain} className="text-lg py-6">
              📄 PDF ફરી ડાઉનલોડ
            </Button>
            <Button type="button" variant="outline" onClick={() => navigate(`/id-card/${form.mobile}`)} className="text-lg py-6">
              🪪 ID કાર્ડ
            </Button>
          </div>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default ProfileForm;
