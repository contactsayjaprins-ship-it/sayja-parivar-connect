import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { Loader2, Phone, MessageCircle } from 'lucide-react';
import { fetchAllProfiles } from '@/lib/api';
import { FamilyProfile } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

interface Person {
  fullName: string;
  mobile: string;
  nativeVillage: string;
  currentVillage: string;
  education: string;
  occupation: string;
  govJob: 'Yes' | 'No';
  photo?: string;
  role: string; // મુખ્ય / સંબંધ
  familyHead: string;
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
      photo: p.profilePhoto,
      role: 'મુખ્ય',
      familyHead: p.name,
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
        photo: m.photo,
        role: m.relation || 'સભ્ય',
        familyHead: p.name,
      });
    });
  });
  return list;
};

const Directory = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [search, setSearch] = useState('');
  const [village, setVillage] = useState('');

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return allPeople.filter(p => {
      if (village && p.nativeVillage !== village) return false;
      if (!q) return true;
      return (
        p.fullName.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        p.nativeVillage.toLowerCase().includes(q) ||
        p.currentVillage.toLowerCase().includes(q)
      );
    });
  }, [allPeople, search, village]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">📞 વ્યક્તિ ડિરેક્ટરી</h1>
          <p className="text-muted-foreground text-sm mt-1">પરિવારના દરેક વ્યક્તિને શોધો અને સીધો સંપર્ક કરો</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Input
            placeholder="🔍 શોધો... (નામ, મોબાઇલ, ગામ)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1"
          />
          <select
            value={village}
            onChange={e => setVillage(e.target.value)}
            className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[160px]"
          >
            <option value="">બધા ગામ</option>
            {villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
        </div>

        <p className="text-sm text-muted-foreground">કુલ: {filtered.length} વ્યક્તિ</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => (
              <motion.div
                key={`${p.mobile}-${i}`}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.02, 0.3) }}
                className="bg-card border border-border rounded-2xl p-4 shadow-card flex gap-3"
              >
                {p.photo ? (
                  <img src={p.photo} alt={p.fullName} loading="lazy" className="w-14 h-14 rounded-full object-cover border-2 border-primary flex-shrink-0" />
                ) : (
                  <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl flex-shrink-0">👤</div>
                )}
                <div className="flex-1 min-w-0 space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <p className="font-semibold truncate">{p.fullName || 'નામ નથી'}</p>
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-secondary text-secondary-foreground">{p.role}</span>
                    {p.govJob === 'Yes' && (
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">સરકારી</span>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{p.nativeVillage || '-'} → {p.currentVillage || '-'}</p>
                  <p className="text-xs text-muted-foreground truncate">{p.occupation || '-'} • {p.education || '-'}</p>
                  <div className="flex gap-2 pt-2">
                    {p.mobile ? (
                      <>
                        <a href={`tel:${p.mobile}`} className="flex-1">
                          <Button size="sm" className="w-full gradient-primary text-primary-foreground border-0">
                            <Phone className="w-3.5 h-3.5 mr-1" /> કૉલ
                          </Button>
                        </a>
                        <a
                          href={`https://wa.me/91${p.mobile.replace(/\D/g, '').slice(-10)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex-1"
                        >
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
            ))}
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
