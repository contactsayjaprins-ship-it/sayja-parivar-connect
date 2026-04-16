import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, FamilyProfile } from '@/lib/store';
import { fetchAllProfiles, deleteProfileByMobile, fetchAdmins, promoteToAdmin, revokeAdmin } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';
import { Loader2 } from 'lucide-react';

const AdminPanel = () => {
  const { isAdmin } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdmin, setNewAdmin] = useState('');
  const [loading, setLoading] = useState(true);

  const reloadAdmins = async () => {
    try { setAdmins(await fetchAdmins()); } catch {}
  };

  useEffect(() => {
    if (!isAdmin) { navigate('/'); return; }
    (async () => {
      try {
        const [p] = await Promise.all([fetchAllProfiles(), reloadAdmins()]);
        setProfiles(p);
      } catch (err: any) {
        toast({ title: 'ભૂલ', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [isAdmin, navigate]);

  const handlePromote = async () => {
    try {
      await promoteToAdmin(newAdmin);
      setNewAdmin('');
      await reloadAdmins();
      toast({ title: 'સફળતા', description: 'એડમિન બનાવ્યા' });
    } catch (err: any) {
      toast({ title: 'ભૂલ', description: err.message, variant: 'destructive' });
    }
  };

  const handleRevoke = async (mobile: string) => {
    if (mobile === '8140805960') {
      toast({ title: 'ભૂલ', description: 'મુખ્ય એડમિન દૂર ના કરી શકાય', variant: 'destructive' });
      return;
    }
    if (!confirm(`${mobile} નું એડમિન દૂર કરવું?`)) return;
    try { await revokeAdmin(mobile); await reloadAdmins(); toast({ title: 'ડિલીટ', description: 'એડમિન દૂર' }); }
    catch (err: any) { toast({ title: 'ભૂલ', description: err.message, variant: 'destructive' }); }
  };

  const filtered = profiles.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.mobile.includes(search) ||
    p.nativeVillage.toLowerCase().includes(search.toLowerCase())
  );

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const mainData = profiles.map(p => ({
      'નામ': p.name,
      'મોબાઇલ': p.mobile,
      'Email': p.email,
      'મૂળ ગામ': p.nativeVillage,
      'હાલ ગામ': p.currentVillage,
      'વ્યવસાય': p.occupation,
      'ભણતર': p.education,
      'કુલ સભ્ય': p.totalMembers,
      'એડ્રેસ': p.address,
      'પ્રોફાઇલ ફોટો URL': p.profilePhoto || '',
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mainData), 'Main Data');

    const membersData = profiles.flatMap(p =>
      p.members.map(m => ({
        'યુઝર મોબાઇલ': p.mobile,
        'નામ': m.name,
        'સંબંધ': m.relation,
        'વ્યવસાય': m.occupation,
        'ભણતર': m.education,
        'મોબાઇલ': m.mobile,
        'લિંગ': m.gender,
        'ફોટો URL': m.photo || '',
      }))
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(membersData), 'Family Members');

    XLSX.writeFile(wb, `sayja-parivar-${new Date().toISOString().slice(0, 10)}.xlsx`);
    toast({ title: 'સફળતા', description: 'Excel ડાઉનલોડ થયું!' });
  };

  const handleDelete = async (mobile: string) => {
    if (!confirm('શું તમે ખરેખર ડિલીટ કરવા માંગો છો?')) return;
    try {
      await deleteProfileByMobile(mobile);
      setProfiles(p => p.filter(x => x.mobile !== mobile));
      toast({ title: 'ડિલીટ', description: 'પ્રોફાઇલ ડિલીટ થઈ' });
    } catch (err: any) {
      toast({ title: 'ભૂલ', description: err.message, variant: 'destructive' });
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">👑 એડમિન પેનલ</h1>
            <Button onClick={exportExcel} className="gradient-primary text-primary-foreground border-0">
              📤 Excel ડાઉનલોડ
            </Button>
          </div>

          <Input
            placeholder="🔍 શોધો... (નામ, મોબાઇલ, ગામ)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="max-w-md"
          />

          <p className="text-muted-foreground text-sm">કુલ: {filtered.length} પ્રોફાઇલ</p>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="space-y-4">
              {filtered.map(p => (
                <motion.div
                  key={p.mobile}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border p-4 shadow-card"
                >
                  <div className="flex flex-col sm:flex-row justify-between gap-3">
                    <div className="flex gap-3 items-start">
                      {p.profilePhoto ? (
                        <img src={p.profilePhoto} alt={p.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary" />
                      ) : (
                        <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl">👤</div>
                      )}
                      <div className="space-y-1">
                        <p className="font-semibold text-lg">{p.name || 'નામ નથી'}</p>
                        <p className="text-sm text-muted-foreground">📞 {p.mobile} • {p.nativeVillage} → {p.currentVillage}</p>
                        <p className="text-sm text-muted-foreground">💼 {p.occupation} • 🎓 {p.education} • 👨‍👩‍👧 {p.members.length}/{p.totalMembers} સભ્ય</p>
                      </div>
                    </div>
                    <div className="flex gap-2 self-start">
                      <Button variant="destructive" size="sm" onClick={() => handleDelete(p.mobile)}>
                        🗑️
                      </Button>
                    </div>
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && (
                <p className="text-center text-muted-foreground py-8">કોઈ ડેટા મળ્યો નહીં</p>
              )}
            </div>
          )}
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPanel;
