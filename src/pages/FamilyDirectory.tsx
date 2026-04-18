import { useEffect, useMemo, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { motion } from 'framer-motion';
import { Loader2, Phone, MessageCircle, MapPin } from 'lucide-react';
import { fetchAllProfiles } from '@/lib/api';
import { FamilyProfile } from '@/lib/store';
import { toast } from '@/hooks/use-toast';

const FamilyDirectory = () => {
  const [loading, setLoading] = useState(true);
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [search, setSearch] = useState('');
  const [open, setOpen] = useState<FamilyProfile | null>(null);

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

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return profiles;
    return profiles.filter(p =>
      p.name.toLowerCase().includes(q) ||
      p.mobile.includes(q) ||
      (p.nativeVillage || '').toLowerCase().includes(q) ||
      (p.currentVillage || '').toLowerCase().includes(q) ||
      (p.address || '').toLowerCase().includes(q)
    );
  }, [profiles, search]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">🏠 પરિવાર ડિરેક્ટરી</h1>
          <p className="text-muted-foreground text-sm mt-1">દરેક પરિવારની સંપૂર્ણ વિગતો જુઓ</p>
        </div>

        <Input
          placeholder="🔍 શોધો... (નામ, મોબાઇલ, ગામ, એડ્રેસ)"
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="max-w-md"
        />

        <p className="text-sm text-muted-foreground">કુલ: {filtered.length} પરિવાર</p>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {filtered.map((p, i) => (
              <motion.button
                key={p.mobile}
                onClick={() => setOpen(p)}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.03, 0.3) }}
                className="text-left bg-card border border-border rounded-2xl shadow-card overflow-hidden hover:shadow-elevated transition-shadow"
              >
                <div className="aspect-video bg-muted relative overflow-hidden">
                  {p.housePhoto ? (
                    <img src={p.housePhoto} alt="House" loading="lazy" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-5xl">🏠</div>
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
                  <p className="text-xs text-muted-foreground line-clamp-2">{p.address || '-'}</p>
                  <p className="text-xs text-primary font-medium pt-1">👨‍👩‍👧 {p.members.length} સભ્ય</p>
                </div>
              </motion.button>
            ))}
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
                <DialogTitle className="text-xl">{open.name} {open.surname} નો પરિવાર</DialogTitle>
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
                    {open.govJob === 'Yes' && <p>🏛 સરકારી નોકરી: {open.govJobPlace || '-'}</p>}
                    <div className="flex gap-2 pt-2">
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
                        <a href={`https://www.google.com/maps?q=${open.lat},${open.lng}`} target="_blank" rel="noopener noreferrer">
                          <Button size="sm" variant="outline">
                            <MapPin className="w-3.5 h-3.5 mr-1" /> નકશા
                          </Button>
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                <div className="bg-secondary/40 rounded-xl p-4 text-sm">
                  <b>એડ્રેસ:</b> {open.address || '-'}
                </div>
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
