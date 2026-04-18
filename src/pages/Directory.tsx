import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2, Phone, MessageCircle, Star, Mic, MicOff } from 'lucide-react';
import { fetchAllProfiles } from '@/lib/api';
import { FamilyProfile, useAppStore, CATEGORY_TAGS } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { useVoiceInput } from '@/hooks/useVoiceInput';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';

interface Person {
  fullName: string;
  mobile: string;
  nativeVillage: string;
  currentVillage: string;
  education: string;
  occupation: string;
  govJob: 'Yes' | 'No';
  bloodGroup: string;
  photo?: string;
  role: string;
  familyHead: string;
  familyId: string;
  categoryTag?: string;
}

const flatten = (profiles: FamilyProfile[]): Person[] => {
  const list: Person[] = [];
  profiles.forEach(p => {
    list.push({
      fullName: `${p.name} ${p.surname || ''}`.trim(),
      mobile: p.mobile,
      nativeVillage: p.nativeVillage,
      currentVillage: p.currentVillage,
      education: p.education,
      occupation: p.occupation,
      govJob: p.govJob,
      bloodGroup: p.bloodGroup || '',
      photo: p.profilePhoto,
      role: 'મુખ્ય',
      familyHead: p.name,
      familyId: p.id,
      categoryTag: p.categoryTag,
    });
    p.members.forEach(m => {
      if (!m.name) return;
      list.push({
        fullName: `${m.name} ${p.surname || ''}`.trim(),
        mobile: m.mobile,
        nativeVillage: p.nativeVillage,
        currentVillage: p.currentVillage,
        education: m.education,
        occupation: m.occupation,
        govJob: m.govJob,
        bloodGroup: m.bloodGroup || '',
        photo: m.photo,
        role: m.relation || 'સભ્ય',
        familyHead: p.name,
        familyId: p.id,
        categoryTag: p.categoryTag,
      });
    });
  });
  return list;
};

const Directory = () => {
  const { favorites, toggleFavorite } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [search, setSearch] = useState('');
  const [village, setVillage] = useState('');
  const [tag, setTag] = useState('');
  const [blood, setBlood] = useState('');
  const [favOnly, setFavOnly] = useState(false);

  const voice = useVoiceInput((t) => setSearch(t));

  useEffect(() => {
    (async () => {
      try {
        setProfiles(await fetchAllProfiles());
      } catch (err: any) {
        toast({ title: 'ભૂલ', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const allPeople = useMemo(() => flatten(profiles), [profiles]);

  const villages = useMemo(
    () => Array.from(new Set(allPeople.map(p => p.nativeVillage).filter(Boolean))).sort(),
    [allPeople]
  );

  const preFiltered = useMemo(() => allPeople.filter(p => {
    if (village && p.nativeVillage !== village) return false;
    if (tag && p.categoryTag !== tag) return false;
    if (blood && p.bloodGroup !== blood) return false;
    if (favOnly && !favorites.includes(p.familyId)) return false;
    return true;
  }), [allPeople, village, tag, blood, favOnly, favorites]);

  const filtered = useFuzzySearch(preFiltered, ['fullName', 'mobile', 'nativeVillage', 'currentVillage', 'occupation'], search);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">📞 વ્યક્તિ ડિરેક્ટરી</h1>
          <p className="text-muted-foreground text-sm mt-1">સ્માર્ટ સર્ચ • વોઇસ સર્ચ • રેડ ક્રોસ ઇમરજન્સી</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <div className="flex-1 min-w-[200px] flex gap-2">
            <Input
              placeholder='🔍 સ્માર્ટ સર્ચ — દા.ત. "Ahmedabad ma Sayja" અથવા "Prins"'
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1"
            />
            {voice.supported && (
              <Button
                type="button"
                variant={voice.listening ? 'destructive' : 'outline'}
                onClick={() => voice.listening ? voice.stop() : voice.start()}
                title="🎤 બોલીને શોધો"
              >
                {voice.listening ? <MicOff className="w-4 h-4 animate-pulse" /> : <Mic className="w-4 h-4" />}
              </Button>
            )}
          </div>
          <select value={village} onChange={e => setVillage(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[140px]">
            <option value="">બધા ગામ</option>
            {villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={tag} onChange={e => setTag(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">બધા કેટેગરી</option>
            {CATEGORY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <select value={blood} onChange={e => setBlood(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">🩸 બધા Blood</option>
            {['A+','A-','B+','B-','AB+','AB-','O+','O-'].map(b => <option key={b} value={b}>{b}</option>)}
          </select>
          <Button
            type="button"
            variant={favOnly ? 'default' : 'outline'}
            onClick={() => setFavOnly(v => !v)}
            className={favOnly ? 'gradient-primary text-primary-foreground border-0' : ''}
          >
            <Star className={`w-4 h-4 mr-1 ${favOnly ? 'fill-current' : ''}`} /> પિન કરેલા
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">કુલ: {filtered.length} વ્યક્તિ</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => {
              const fav = favorites.includes(p.familyId);
              return (
                <motion.div
                  key={`${p.mobile}-${i}`}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.02, 0.3) }}
                  className="bg-card border border-border rounded-2xl p-4 shadow-card flex gap-3 relative"
                >
                  <button
                    onClick={() => toggleFavorite(p.familyId)}
                    className="absolute top-2 right-2 p-1"
                    aria-label="પિન"
                  >
                    <Star className={`w-4 h-4 ${fav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                  {p.photo ? (
                    <img src={p.photo} alt={p.fullName} loading="lazy" className="w-14 h-14 rounded-full object-cover border-2 border-primary flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl flex-shrink-0">👤</div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <div className="flex items-center gap-2 flex-wrap pr-6">
                      <p className="font-semibold truncate">{p.fullName || 'નામ નથી'}</p>
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{p.role}</span>
                      {p.govJob === 'Yes' && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">સરકારી</span>
                      )}
                      {p.bloodGroup && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">🩸 {p.bloodGroup}</span>
                      )}
                      {p.categoryTag && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700">{p.categoryTag}</span>
                      )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{p.nativeVillage || '-'} → {p.currentVillage || '-'}</p>
                    <p className="text-xs text-muted-foreground truncate">💼 {p.occupation || '-'} • 🎓 {p.education || '-'}</p>
                    <div className="flex gap-2 pt-2">
                      {p.mobile ? (
                        <>
                          <a href={`tel:${p.mobile}`} className="flex-1">
                            <Button size="sm" className="w-full gradient-primary text-primary-foreground border-0">
                              <Phone className="w-3.5 h-3.5 mr-1" /> કૉલ
                            </Button>
                          </a>
                          <a href={`https://wa.me/91${p.mobile.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer" className="flex-1">
                            <Button size="sm" variant="outline" className="w-full">
                              <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                            </Button>
                          </a>
                        </>
                      ) : (
                        <span className="text-xs text-muted-foreground italic">મોબાઇલ નથી</span>
                      )}
                    </div>
                  </div>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8">કોઈ વ્યક્તિ મળી નહીં</p>
            )}
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default Directory;
