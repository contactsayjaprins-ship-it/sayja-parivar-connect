import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, FamilyProfile } from '@/lib/store';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/hooks/use-toast';
import * as XLSX from 'xlsx';

const AdminPanel = () => {
  const { isAdmin, allProfiles, deleteProfile } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  useEffect(() => {
    if (!isAdmin) { navigate('/'); }
  }, [isAdmin, navigate]);

  const filtered = allProfiles.filter(p =>
    p.name.toLowerCase().includes(search.toLowerCase()) ||
    p.mobile.includes(search) ||
    p.nativeVillage.toLowerCase().includes(search.toLowerCase())
  );

  const exportExcel = () => {
    const wb = XLSX.utils.book_new();

    const mainData = allProfiles.map(p => ({
      'નામ': p.name,
      'મોબાઇલ': p.mobile,
      'Email': p.email,
      'મૂળ ગામ': p.nativeVillage,
      'હાલ ગામ': p.currentVillage,
      'વ્યવસાય': p.occupation,
      'ભણતર': p.education,
      'કુલ સભ્ય': p.totalMembers,
      'એડ્રેસ': p.address,
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(mainData), 'Main Data');

    const membersData = allProfiles.flatMap(p =>
      p.members.map(m => ({
        'યુઝર મોબાઇલ': p.mobile,
        'નામ': m.name,
        'સંબંધ': m.relation,
        'વ્યવસાય': m.occupation,
        'ભણતર': m.education,
        'મોબાઇલ': m.mobile,
        'લિંગ': m.gender,
      }))
    );
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(membersData), 'Family Members');

    XLSX.writeFile(wb, 'sayja-parivar-data.xlsx');
    toast({ title: 'સફળતા', description: 'Excel ડાઉનલોડ થયું!' });
  };

  const handleDelete = (mobile: string) => {
    if (confirm('શું તમે ખરેખર ડિલીટ કરવા માંગો છો?')) {
      deleteProfile(mobile);
      toast({ title: 'ડિલીટ', description: 'પ્રોફાઇલ ડિલીટ થઈ' });
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

          <div className="space-y-4">
            {filtered.map(p => (
              <motion.div
                key={p.mobile}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-card rounded-xl border border-border p-4 shadow-card"
              >
                <div className="flex flex-col sm:flex-row justify-between gap-3">
                  <div className="space-y-1">
                    <p className="font-semibold text-lg">{p.name || 'નામ નથી'}</p>
                    <p className="text-sm text-muted-foreground">📞 {p.mobile} • {p.nativeVillage} → {p.currentVillage}</p>
                    <p className="text-sm text-muted-foreground">💼 {p.occupation} • 🎓 {p.education} • 👨‍👩‍👧 {p.totalMembers} સભ્ય</p>
                  </div>
                  <div className="flex gap-2 self-start">
                    <Button variant="outline" size="sm" onClick={() => navigate(`/profile`)}>
                      ✏️
                    </Button>
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
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default AdminPanel;
