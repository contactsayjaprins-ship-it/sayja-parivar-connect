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
import ExcelJS from 'exceljs';
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

  const [exporting, setExporting] = useState(false);

  // Fetch image URL → { buffer, ext } for ExcelJS embedding
  const fetchImage = async (url: string): Promise<{ buffer: ArrayBuffer; ext: 'png' | 'jpeg' | 'gif' } | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      const buffer = await blob.arrayBuffer();
      const type = blob.type.toLowerCase();
      const ext: 'png' | 'jpeg' | 'gif' =
        type.includes('png') ? 'png' :
        type.includes('gif') ? 'gif' : 'jpeg';
      return { buffer, ext };
    } catch {
      return null;
    }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Sayja Parivar';
      wb.created = new Date();

      const ws = wb.addWorksheet('Family Full Data', {
        views: [{ state: 'frozen', ySplit: 1 }],
      });

      // Find max members across all families to build dynamic columns
      const maxMembers = profiles.reduce((m, p) => Math.max(m, p.members.length), 0);

      // Build header columns: main fields + N×member fields → ONE row per family
      const baseCols = [
        { header: 'Family ID (Mobile)', key: 'familyId', width: 20 },
        { header: 'Main Name', key: 'mainName', width: 22 },
        { header: 'Surname', key: 'surname', width: 14 },
        { header: 'Main Mobile', key: 'mainMobile', width: 16 },
        { header: 'Email', key: 'email', width: 26 },
        { header: 'Native Village', key: 'nativeVillage', width: 18 },
        { header: 'Current Village', key: 'currentVillage', width: 18 },
        { header: 'Occupation', key: 'occupation', width: 18 },
        { header: 'Government Job', key: 'govJob', width: 14 },
        { header: 'Govt Job Place', key: 'govJobPlace', width: 22 },
        { header: 'Education', key: 'education', width: 18 },
        { header: 'Total Members', key: 'totalMembers', width: 12 },
        { header: 'Address', key: 'address', width: 30 },
        { header: 'Profile Photo', key: 'profilePhoto', width: 16 },
        { header: 'Form Photo URL', key: 'formPhoto', width: 30 },
      ];

      const memberCols: any[] = [];
      for (let i = 1; i <= maxMembers; i++) {
        memberCols.push(
          { header: `Member ${i} Name`, key: `m${i}_name`, width: 20 },
          { header: `Member ${i} Relation`, key: `m${i}_relation`, width: 14 },
          { header: `Member ${i} Occupation`, key: `m${i}_occupation`, width: 16 },
          { header: `Member ${i} Govt Job`, key: `m${i}_govJob`, width: 12 },
          { header: `Member ${i} Govt Place`, key: `m${i}_govJobPlace`, width: 18 },
          { header: `Member ${i} Education`, key: `m${i}_education`, width: 16 },
          { header: `Member ${i} Mobile`, key: `m${i}_mobile`, width: 14 },
          { header: `Member ${i} Gender`, key: `m${i}_gender`, width: 10 },
          { header: `Member ${i} Photo`, key: `m${i}_photo`, width: 16 },
        );
      }

      ws.columns = [...baseCols, ...memberCols];

      // Style header row
      const header = ws.getRow(1);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.alignment = { vertical: 'middle', horizontal: 'center' };
      header.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
        cell.border = {
          top: { style: 'thin' }, bottom: { style: 'thin' },
          left: { style: 'thin' }, right: { style: 'thin' },
        };
      });
      header.height = 24;

      // Pre-fetch all unique images
      const uniqueUrls = Array.from(new Set(
        profiles.flatMap(p => [p.profilePhoto, ...p.members.map(m => m.photo)]).filter((u): u is string => !!u)
      ));
      const imageIdMap = new Map<string, number>();
      await Promise.all(uniqueUrls.map(async (url) => {
        const img = await fetchImage(url);
        if (!img) return;
        const id = wb.addImage({ buffer: img.buffer, extension: img.ext });
        imageIdMap.set(url, id);
      }));

      const ROW_HEIGHT = 70;
      const IMG_SIZE = { width: 80, height: 80 };
      // 0-based column index for "Profile Photo"
      const PROFILE_COL = baseCols.findIndex(c => c.key === 'profilePhoto');

      profiles.forEach(p => {
        const rowData: Record<string, any> = {
          familyId: p.mobile,
          mainName: p.name,
          surname: p.surname || '',
          mainMobile: p.mobile,
          email: p.email || '',
          nativeVillage: p.nativeVillage || '',
          currentVillage: p.currentVillage || '',
          occupation: p.occupation || '',
          govJob: p.govJob || 'No',
          govJobPlace: p.govJobPlace || '',
          education: p.education || '',
          totalMembers: p.totalMembers || 0,
          address: p.address || '',
          profilePhoto: '',
          formPhoto: p.formPhoto || '',
        };

        p.members.forEach((m, i) => {
          const k = i + 1;
          rowData[`m${k}_name`] = m.name || '';
          rowData[`m${k}_relation`] = m.relation || '';
          rowData[`m${k}_occupation`] = m.occupation || '';
          rowData[`m${k}_govJob`] = m.govJob || 'No';
          rowData[`m${k}_govJobPlace`] = m.govJobPlace || '';
          rowData[`m${k}_education`] = m.education || '';
          rowData[`m${k}_mobile`] = m.mobile || '';
          rowData[`m${k}_gender`] = m.gender || '';
          rowData[`m${k}_photo`] = '';
        });

        const row = ws.addRow(rowData);
        row.height = ROW_HEIGHT;
        const rowIdx = row.number - 1;

        // Embed profile photo
        if (p.profilePhoto) {
          const id = imageIdMap.get(p.profilePhoto);
          if (id !== undefined) {
            ws.addImage(id, {
              tl: { col: PROFILE_COL + 0.1, row: rowIdx + 0.1 },
              ext: IMG_SIZE,
              editAs: 'oneCell',
            });
          }
        }

        // Embed each member photo
        p.members.forEach((m, i) => {
          if (!m.photo) return;
          const id = imageIdMap.get(m.photo);
          if (id === undefined) return;
          // photo column = index of `m{i+1}_photo` key in ws.columns
          const colIdx = ws.columns.findIndex(c => c.key === `m${i + 1}_photo`);
          if (colIdx < 0) return;
          ws.addImage(id, {
            tl: { col: colIdx + 0.1, row: rowIdx + 0.1 },
            ext: IMG_SIZE,
            editAs: 'oneCell',
          });
        });
      });

      ws.getColumn('address').alignment = { wrapText: true, vertical: 'top' };

      const buf = await wb.xlsx.writeBuffer();
      const blob = new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'Sayja_Parivar_Data.xlsx';
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: 'સફળતા', description: 'Excel ડાઉનલોડ થયું! (એક પરિવાર = એક પંક્તિ)' });
    } catch (err: any) {
      toast({ title: 'ભૂલ', description: err.message || 'Export ફેઇલ', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
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
            <Button onClick={exportExcel} disabled={exporting} className="gradient-primary text-primary-foreground border-0">
              {exporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> તૈયાર થઈ રહ્યું...</> : '📤 Excel ડાઉનલોડ'}
            </Button>
          </div>

          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <h2 className="font-semibold">👑 એડમિન મેનેજમેન્ટ</h2>
            <div className="flex flex-wrap gap-2">
              {admins.map(m => (
                <span key={m} className="inline-flex items-center gap-2 bg-secondary px-3 py-1 rounded-full text-sm">
                  {m}
                  {m !== '8140805960' && (
                    <button onClick={() => handleRevoke(m)} className="text-destructive hover:opacity-70">✕</button>
                  )}
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="નવા એડમિનનો મોબાઇલ"
                value={newAdmin}
                onChange={e => setNewAdmin(e.target.value)}
                className="max-w-xs"
              />
              <Button onClick={handlePromote} disabled={!newAdmin} className="gradient-primary text-primary-foreground border-0">
                ➕ એડમિન બનાવો
              </Button>
            </div>
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
