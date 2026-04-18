import { useEffect, useMemo, useState } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Loader2, Phone, MessageCircle, MapPin, Star, IdCard, Navigation } from 'lucide-react';
import { fetchAllProfiles } from '@/lib/api';
import { FamilyProfile, useAppStore, CATEGORY_TAGS } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { useFuzzySearch } from '@/hooks/useFuzzySearch';

const FamilyDirectory = () => {
  const { favorites, toggleFavorite } = useAppStore();
  const [params] = useSearchParams();
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [search, setSearch] = useState('');
  const [village, setVillage] = useState('');
  const [govFilter, setGovFilter] = useState('');
  const [tag, setTag] = useState('');
  const [favOnly, setFavOnly] = useState(false);
  const [open, setOpen] = useState<FamilyProfile | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const all = await fetchAllProfiles();
        setProfiles(all);
        const fid = params.get('fid');
        if (fid) {
          const found = all.find(p => p.id === fid);
          if (found) setOpen(found);
        }
      } catch (err: any) {
        toast({ title: 'ભૂલ', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [params]);

  const villages = useMemo(
    () => Array.from(new Set(profiles.map(p => p.nativeVillage).filter(Boolean))).sort(),
    [profiles]
  );

  const preFiltered = useMemo(() => profiles.filter(p => {
    if (village && p.nativeVillage !== village) return false;
    if (govFilter === 'Yes' && p.govJob !== 'Yes') return false;
    if (govFilter === 'No' && p.govJob === 'Yes') return false;
    if (tag && p.categoryTag !== tag) return false;
    if (favOnly && !favorites.includes(p.id)) return false;
    return true;
  }), [profiles, village, govFilter, tag, favOnly, favorites]);

  const filtered = useFuzzySearch(preFiltered, ['name', 'mobile', 'nativeVillage', 'currentVillage', 'address'], search);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">🏠 પરિવાર ડિરેક્ટરી</h1>
          <p className="text-muted-foreground text-sm mt-1">દરેક પરિવારની સંપૂર્ણ વિગતો</p>
        </div>

        <div className="flex flex-wrap gap-2">
          <Input placeholder="🔍 શોધો..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[200px] max-w-md" />
          <select value={village} onChange={e => setVillage(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">બધા ગામ</option>
            {villages.map(v => <option key={v} value={v}>{v}</option>)}
          </select>
          <select value={govFilter} onChange={e => setGovFilter(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">સરકારી (બધા)</option>
            <option value="Yes">હા</option>
            <option value="No">ના</option>
          </select>
          <select value={tag} onChange={e => setTag(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="">બધા કેટેગરી</option>
            {CATEGORY_TAGS.map(t => <option key={t} value={t}>{t}</option>)}
          </select>
          <Button variant={favOnly ? 'default' : 'outline'} onClick={() => setFavOnly(v => !v)}
            className={favOnly ? 'gradient-primary text-primary-foreground border-0' : ''}>
            <Star className={`w-4 h-4 mr-1 ${favOnly ? 'fill-current' : ''}`} /> પિન કરેલા
          </Button>
        </div>

        <p className="text-sm text-muted-foreground">કુલ: {filtered.length} પરિવાર</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => {
              const fav = favorites.includes(p.id);
              return (
                <motion.div
                  key={p.id}
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i * 0.03, 0.3) }}
                  className="bg-card border border-border rounded-2xl shadow-card overflow-hidden hover:shadow-elevated transition-shadow relative"
                >
                  <button
                    onClick={(e) => { e.stopPropagation(); toggleFavorite(p.id); }}
                    className="absolute top-2 right-2 z-10 bg-card/80 backdrop-blur rounded-full p-1.5"
                  >
                    <Star className={`w-4 h-4 ${fav ? 'fill-yellow-400 text-yellow-400' : 'text-muted-foreground'}`} />
                  </button>
                  <button onClick={() => setOpen(p)} className="text-left w-full">
                    <div className="aspect-video bg-muted relative overflow-hidden">
                      {p.housePhoto ? (
                        <img src={p.housePhoto} alt="House" loading="lazy" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-5xl">🏠</div>
                      )}
                      {p.familyCode && (
                        <span className="absolute bottom-2 left-2 bg-primary text-primary-foreground text-[10px] px-2 py-0.5 rounded-full font-semibold">
                          {p.familyCode}
                        </span>
                      )}
                    </div>
                    <div className="p-4 space-y-1">
                      <div className="flex items-center gap-2">
                        {p.profilePhoto ? (
                          <img src={p.profilePhoto} alt={p.name} className="w-10 h-10 rounded-full object-cover border-2 border-primary" />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">👤</div>
                        )}
                        <div className="min-w-0 flex-1">
                          <p className="font-semibold truncate">{p.name} {p.surname}</p>
                          <p className="text-xs text-muted-foreground truncate">📞 {p.mobile}</p>
                        </div>
                      </div>
                      <p className="text-xs text-muted-foreground truncate">📍 {p.nativeVillage || '-'} → {p.currentVillage || '-'}</p>
                      <div className="flex gap-1 flex-wrap pt-1">
                        {p.categoryTag && <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-700">{p.categoryTag}</span>}
                        {p.bloodGroup && <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-500/10 text-red-600">🩸 {p.bloodGroup}</span>}
                        {p.govJob === 'Yes' && <span className="text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">સરકારી</span>}
                      </div>
                      <p className="text-xs text-primary font-medium pt-1">👨‍👩‍👧 {p.members.length} સભ્ય</p>
                    </div>
                  </button>
                </motion.div>
              );
            })}
            {filtered.length === 0 && (
              <p className="col-span-full text-center text-muted-foreground py-8">કોઈ પરિવાર મળ્યો નહીં</p>
            )}
          </div>
        )}
      </main>

      <Dialog open={!!open} onOpenChange={() => setOpen(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {open && (
            <>
              <DialogHeader>
                <DialogTitle className="text-xl flex items-center gap-2 flex-wrap">
                  {open.name} {open.surname}
                  {open.familyCode && <span className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary">{open.familyCode}</span>}
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                {open.housePhoto && (
                  <img src={open.housePhoto} alt="House" className="w-full rounded-xl border border-border" />
                )}
                <div className="flex gap-3 items-start bg-secondary/40 rounded-xl p-4">
                  {open.profilePhoto ? (
                    <img src={open.profilePhoto} alt={open.name} className="w-20 h-20 rounded-full object-cover border-2 border-primary" />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-muted flex items-center justify-center text-3xl">👤</div>
                  )}
                  <div className="flex-1 text-sm space-y-1">
                    <p className="font-bold text-base">{open.name} {open.surname}</p>
                    <p>📞 {open.mobile} {open.email && <>• ✉ {open.email}</>}</p>
                    <p>📍 {open.nativeVillage} → {open.currentVillage}</p>
                    <p>💼 {open.occupation || '-'} • 🎓 {open.education || '-'}</p>
                    {open.bloodGroup && <p className="text-red-600 font-semibold">🩸 {open.bloodGroup}</p>}
                    {open.govJob === 'Yes' && <p>🏛 સરકારી નોકરી: {open.govJobPlace || '-'}</p>}
                    <div className="flex gap-2 pt-2 flex-wrap">
                      <a href={`tel:${open.mobile}`}>
                        <Button size="sm" className="gradient-primary text-primary-foreground border-0">
                          <Phone className="w-3.5 h-3.5 mr-1" /> કૉલ
                        </Button>
                      </a>
                      <a href={`https://wa.me/91${open.mobile.replace(/\D/g, '').slice(-10)}`} target="_blank" rel="noopener noreferrer">
                        <Button size="sm" variant="outline">
                          <MessageCircle className="w-3.5 h-3.5 mr-1" /> WhatsApp
                        </Button>
                      </a>
                      {open.lat && open.lng && (
                        <a href={`https://www.google.com/maps/dir/?api=1&destination=${open.lat},${open.lng}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline">
                            <Navigation className="w-3.5 h-3.5 mr-1" /> નકશે જાવ
                          </Button>
                        </a>
                      )}
                      <Link to={`/id-card/${open.mobile}`}>
                        <Button size="sm" variant="outline">
                          <IdCard className="w-3.5 h-3.5 mr-1" /> ID કાર્ડ
                        </Button>
                      </Link>
                    </div>
                  </div>
                </div>

                <div className="bg-secondary/40 rounded-xl p-4 text-sm">
                  <b>એડ્રેસ:</b> {open.address || '-'}
                </div>

                {(open.gallery || []).length > 0 && (
                  <div>
                    <h3 className="font-semibold mb-2">🖼️ ગેલેરી</h3>
                    <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
                      {(open.gallery || []).map((g, i) => (
                        <a key={i} href={g} target="_blank" rel="noopener noreferrer">
                          <img src={g} alt="" loading="lazy" className="w-full aspect-square object-cover rounded-md hover:opacity-90" />
                        </a>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2">👨‍👩‍👧 પરિવારના સભ્યો ({open.members.length})</h3>
                  <div className="space-y-2">
                    {open.members.map((m, i) => (
                      <div key={m.id} className="flex gap-3 items-center bg-card border border-border rounded-xl p-3">
                        {m.photo ? (
                          <img src={m.photo} alt={m.name} className="w-12 h-12 rounded-full object-cover border-2 border-accent flex-shrink-0" />
                        ) : (
                          <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center flex-shrink-0">👤</div>
                        )}
                        <div className="flex-1 text-sm min-w-0">
                          <p className="font-medium">{i + 1}. {m.name} <span className="text-xs text-muted-foreground">({m.relation})</span></p>
                          <p className="text-xs text-muted-foreground truncate">
                            {m.occupation || '-'} • {m.education || '-'} • {m.gender}
                            {m.bloodGroup && ` • 🩸 ${m.bloodGroup}`}
                            {m.govJob === 'Yes' && ` • 🏛 ${m.govJobPlace || 'સરકારી'}`}
                          </p>
                          {m.mobile && <p className="text-xs text-primary">📞 {m.mobile}</p>}
                        </div>
                        {m.mobile && (
                          <a href={`tel:${m.mobile}`}>
                            <Button size="sm" variant="ghost"><Phone className="w-4 h-4" /></Button>
                          </a>
                        )}
                      </div>
                    ))}
                    {open.members.length === 0 && (
                      <p className="text-sm text-muted-foreground italic">કોઈ સભ્ય ઉમેર્યો નથી</p>
                    )}
                  </div>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default FamilyDirectory;
