import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, FamilyProfile } from '@/lib/store';
import { fetchAllProfiles, deleteProfileByMobile, fetchAdmins, promoteToAdmin, revokeAdmin } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/hooks/use-toast';
import ExcelJS from 'exceljs';
import { Loader2, Users, Briefcase, Home, MapPin, LayoutGrid, List, Eye, Phone } from 'lucide-react';

const AdminPanel = () => {
  const { isAdmin } = useAppStore();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [admins, setAdmins] = useState<string[]>([]);
  const [newAdmin, setNewAdmin] = useState('');
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'card' | 'table'>('card');
  const [filterVillage, setFilterVillage] = useState('');
  const [filterGov, setFilterGov] = useState<'' | 'Yes' | 'No'>('');
  const [filterEdu, setFilterEdu] = useState('');
  const [openProfile, setOpenProfile] = useState<FamilyProfile | null>(null);
  const [exporting, setExporting] = useState(false);

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

  // Analytics
  const stats = useMemo(() => {
    const totalFamilies = profiles.length;
    const totalMembers = profiles.reduce((sum, p) => sum + p.members.length + 1, 0);
    const govCount = profiles.reduce(
      (sum, p) => sum + (p.govJob === 'Yes' ? 1 : 0) + p.members.filter(m => m.govJob === 'Yes').length,
      0
    );
    const villageMap = new Map<string, number>();
    profiles.forEach(p => {
      const v = p.nativeVillage || '(અજાણ)';
      villageMap.set(v, (villageMap.get(v) || 0) + 1);
    });
    const villages = Array.from(villageMap.entries()).sort((a, b) => b[1] - a[1]);
    return { totalFamilies, totalMembers, govCount, villages };
  }, [profiles]);

  const villageOptions = useMemo(
    () => Array.from(new Set(profiles.map(p => p.nativeVillage).filter(Boolean))).sort(),
    [profiles]
  );
  const eduOptions = useMemo(
    () => Array.from(new Set(profiles.map(p => p.education).filter(Boolean))).sort(),
    [profiles]
  );

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    return profiles.filter(p => {
      if (filterVillage && p.nativeVillage !== filterVillage) return false;
      if (filterGov && p.govJob !== filterGov) return false;
      if (filterEdu && p.education !== filterEdu) return false;
      if (!q) return true;
      return (
        p.name.toLowerCase().includes(q) ||
        p.mobile.includes(q) ||
        (p.nativeVillage || '').toLowerCase().includes(q)
      );
    });
  }, [profiles, search, filterVillage, filterGov, filterEdu]);

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

  const fetchImage = async (url: string): Promise<{ buffer: ArrayBuffer; ext: 'png' | 'jpeg' | 'gif' } | null> => {
    try {
      const res = await fetch(url);
      if (!res.ok) return null;
      const blob = await res.blob();
      const buffer = await blob.arrayBuffer();
      const type = blob.type.toLowerCase();
      const ext: 'png' | 'jpeg' | 'gif' = type.includes('png') ? 'png' : type.includes('gif') ? 'gif' : 'jpeg';
      return { buffer, ext };
    } catch { return null; }
  };

  const exportExcel = async () => {
    setExporting(true);
    try {
      const wb = new ExcelJS.Workbook();
      wb.creator = 'Sayja Parivar';
      wb.created = new Date();
      const ws = wb.addWorksheet('Family Full Data', { views: [{ state: 'frozen', ySplit: 1 }] });
      const maxMembers = profiles.reduce((m, p) => Math.max(m, p.members.length), 0);

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
        { header: 'Latitude', key: 'lat', width: 12 },
        { header: 'Longitude', key: 'lng', width: 12 },
        { header: 'Profile Photo', key: 'profilePhoto', width: 16 },
        { header: 'House Photo', key: 'housePhoto', width: 16 },
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
      const header = ws.getRow(1);
      header.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      header.alignment = { vertical: 'middle', horizontal: 'center' };
      header.eachCell(cell => {
        cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1F4E78' } };
        cell.border = { top: { style: 'thin' }, bottom: { style: 'thin' }, left: { style: 'thin' }, right: { style: 'thin' } };
      });
      header.height = 24;

      const uniqueUrls = Array.from(new Set(
        profiles.flatMap(p => [p.profilePhoto, p.housePhoto, ...p.members.map(m => m.photo)]).filter((u): u is string => !!u)
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
      const PROFILE_COL = baseCols.findIndex(c => c.key === 'profilePhoto');
      const HOUSE_COL = baseCols.findIndex(c => c.key === 'housePhoto');

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
          lat: p.lat ?? '',
          lng: p.lng ?? '',
          profilePhoto: '',
          housePhoto: '',
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

        const embed = (url: string | undefined, col: number) => {
          if (!url) return;
          const id = imageIdMap.get(url);
          if (id === undefined) return;
          ws.addImage(id, { tl: { col: col + 0.1, row: rowIdx + 0.1 }, ext: IMG_SIZE, editAs: 'oneCell' });
        };
        embed(p.profilePhoto, PROFILE_COL);
        embed(p.housePhoto, HOUSE_COL);
        p.members.forEach((m, i) => {
          if (!m.photo) return;
          const colIdx = ws.columns.findIndex(c => c.key === `m${i + 1}_photo`);
          if (colIdx >= 0) embed(m.photo, colIdx);
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
      toast({ title: 'સફળતા', description: 'Excel ડાઉનલોડ થયું!' });
    } catch (err: any) {
      toast({ title: 'ભૂલ', description: err.message || 'Export ફેઇલ', variant: 'destructive' });
    } finally {
      setExporting(false);
    }
  };

  const StatCard = ({ icon: Icon, label, value, color }: any) => (
    <div className="bg-card border border-border rounded-2xl p-4 shadow-card flex items-center gap-3">
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${color}`}>
        <Icon className="w-6 h-6 text-primary-foreground" />
      </div>
      <div>
        <p className="text-2xl font-bold">{value}</p>
        <p className="text-xs text-muted-foreground">{label}</p>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <h1 className="text-2xl font-bold">👑 એડમિન ડેશબોર્ડ</h1>
            <Button onClick={exportExcel} disabled={exporting} className="gradient-primary text-primary-foreground border-0">
              {exporting ? <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> તૈયાર થઈ રહ્યું...</> : '📤 Excel ડાઉનલોડ'}
            </Button>
          </div>

          {/* Analytics */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <StatCard icon={Home} label="કુલ પરિવાર" value={stats.totalFamilies} color="bg-primary" />
            <StatCard icon={Users} label="કુલ સભ્ય" value={stats.totalMembers} color="bg-accent" />
            <StatCard icon={Briefcase} label="સરકારી નોકરી" value={stats.govCount} color="bg-emerald-500" />
            <StatCard icon={MapPin} label="ગામ" value={stats.villages.length} color="bg-blue-500" />
          </div>

          {stats.villages.length > 0 && (
            <div className="bg-card border border-border rounded-2xl p-4">
              <h2 className="font-semibold mb-3">📍 ગામ પ્રમાણે વિતરણ</h2>
              <div className="flex flex-wrap gap-2">
                {stats.villages.slice(0, 12).map(([v, c]) => (
                  <span key={v} className="text-xs px-3 py-1 rounded-full bg-secondary text-secondary-foreground">
                    {v} <b className="text-primary">{c}</b>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Admin Management */}
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
              <Input placeholder="નવા એડમિનનો મોબાઇલ" value={newAdmin} onChange={e => setNewAdmin(e.target.value)} className="max-w-xs" />
              <Button onClick={handlePromote} disabled={!newAdmin} className="gradient-primary text-primary-foreground border-0">
                ➕ એડમિન બનાવો
              </Button>
            </div>
          </div>

          {/* Filters */}
          <div className="bg-card border border-border rounded-xl p-4 space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <Input placeholder="🔍 શોધો..." value={search} onChange={e => setSearch(e.target.value)} className="flex-1 min-w-[200px] max-w-md" />
              <select value={filterVillage} onChange={e => setFilterVillage(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">બધા ગામ</option>
                {villageOptions.map(v => <option key={v} value={v}>{v}</option>)}
              </select>
              <select value={filterGov} onChange={e => setFilterGov(e.target.value as any)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">સરકારી નોકરી (બધા)</option>
                <option value="Yes">હા</option>
                <option value="No">ના</option>
              </select>
              <select value={filterEdu} onChange={e => setFilterEdu(e.target.value)} className="h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="">બધા ભણતર</option>
                {eduOptions.map(e => <option key={e} value={e}>{e}</option>)}
              </select>
              <div className="flex border border-border rounded-md overflow-hidden">
                <button onClick={() => setView('card')} className={`p-2 ${view === 'card' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}><LayoutGrid className="w-4 h-4" /></button>
                <button onClick={() => setView('table')} className={`p-2 ${view === 'table' ? 'bg-primary text-primary-foreground' : 'bg-card'}`}><List className="w-4 h-4" /></button>
              </div>
            </div>
            <p className="text-muted-foreground text-sm">કુલ બતાવ્યું: {filtered.length} પરિવાર</p>
          </div>

          {loading ? (
            <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : view === 'card' ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filtered.map(p => (
                <motion.div key={p.mobile} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }}
                  className="bg-card rounded-xl border border-border p-4 shadow-card flex gap-3">
                  {p.profilePhoto ? (
                    <img src={p.profilePhoto} alt={p.name} className="w-14 h-14 rounded-full object-cover border-2 border-primary flex-shrink-0" />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-muted flex items-center justify-center text-xl flex-shrink-0">👤</div>
                  )}
                  <div className="flex-1 min-w-0 space-y-1">
                    <p className="font-semibold">{p.name} {p.surname}</p>
                    <p className="text-xs text-muted-foreground">📞 {p.mobile} • {p.nativeVillage} → {p.currentVillage}</p>
                    <p className="text-xs text-muted-foreground">💼 {p.occupation} • 🎓 {p.education} • 👨‍👩‍👧 {p.members.length}/{p.totalMembers}</p>
                    {p.govJob === 'Yes' && <span className="inline-block text-[10px] px-2 py-0.5 rounded-full bg-primary/10 text-primary">સરકારી: {p.govJobPlace}</span>}
                  </div>
                  <div className="flex flex-col gap-1">
                    <Button size="sm" variant="outline" onClick={() => setOpenProfile(p)}><Eye className="w-3.5 h-3.5" /></Button>
                    <Button size="sm" variant="destructive" onClick={() => handleDelete(p.mobile)}>🗑️</Button>
                  </div>
                </motion.div>
              ))}
              {filtered.length === 0 && <p className="col-span-full text-center text-muted-foreground py-8">કોઈ ડેટા મળ્યો નહીં</p>}
            </div>
          ) : (
            <div className="bg-card border border-border rounded-xl overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>નામ</TableHead>
                    <TableHead>મોબાઇલ</TableHead>
                    <TableHead>મૂળ ગામ</TableHead>
                    <TableHead>હાલ</TableHead>
                    <TableHead>વ્યવસાય</TableHead>
                    <TableHead>સરકારી</TableHead>
                    <TableHead>સભ્ય</TableHead>
                    <TableHead>ક્રિયા</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map(p => (
                    <TableRow key={p.mobile}>
                      <TableCell className="font-medium">{p.name} {p.surname}</TableCell>
                      <TableCell>{p.mobile}</TableCell>
                      <TableCell>{p.nativeVillage}</TableCell>
                      <TableCell>{p.currentVillage}</TableCell>
                      <TableCell>{p.occupation}</TableCell>
                      <TableCell>{p.govJob === 'Yes' ? '✅' : '—'}</TableCell>
                      <TableCell>{p.members.length}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button size="sm" variant="outline" onClick={() => setOpenProfile(p)}><Eye className="w-3.5 h-3.5" /></Button>
                          <Button size="sm" variant="destructive" onClick={() => handleDelete(p.mobile)}>🗑️</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </motion.div>
      </main>

      <Dialog open={!!openProfile} onOpenChange={() => setOpenProfile(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          {openProfile && (
            <>
              <DialogHeader>
                <DialogTitle>{openProfile.name} {openProfile.surname} — સંપૂર્ણ વિગતો</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {openProfile.profilePhoto && <img src={openProfile.profilePhoto} className="w-full aspect-square object-cover rounded-xl border border-border" />}
                  {openProfile.housePhoto && <img src={openProfile.housePhoto} className="w-full aspect-square object-cover rounded-xl border border-border" />}
                </div>
                <div className="bg-secondary/40 rounded-xl p-4 text-sm space-y-1">
                  <p>📞 {openProfile.mobile} {openProfile.email && `• ✉ ${openProfile.email}`}</p>
                  <p>📍 {openProfile.nativeVillage} → {openProfile.currentVillage}</p>
                  <p>💼 {openProfile.occupation} • 🎓 {openProfile.education}</p>
                  {openProfile.govJob === 'Yes' && <p>🏛 સરકારી: {openProfile.govJobPlace}</p>}
                  <p>🏠 {openProfile.address}</p>
                  {openProfile.lat && openProfile.lng && (
                    <p>🗺️ <a className="text-primary underline" href={`https://maps.google.com/?q=${openProfile.lat},${openProfile.lng}`} target="_blank" rel="noopener noreferrer">નકશા પર જુઓ</a></p>
                  )}
                  <a href={`tel:${openProfile.mobile}`}><Button size="sm" className="mt-2 gradient-primary text-primary-foreground border-0"><Phone className="w-3.5 h-3.5 mr-1" /> કૉલ</Button></a>
                </div>
                <div>
                  <h3 className="font-semibold mb-2">સભ્યો ({openProfile.members.length})</h3>
                  <div className="space-y-2">
                    {openProfile.members.map((m, i) => (
                      <div key={m.id} className="flex gap-3 items-center bg-card border border-border rounded-xl p-3">
                        {m.photo ? <img src={m.photo} className="w-12 h-12 rounded-full object-cover border-2 border-accent" /> : <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center">👤</div>}
                        <div className="flex-1 text-sm">
                          <p className="font-medium">{i + 1}. {m.name} <span className="text-xs text-muted-foreground">({m.relation})</span></p>
                          <p className="text-xs text-muted-foreground">{m.occupation || '-'} • {m.education || '-'} • {m.gender}</p>
                          {m.mobile && <p className="text-xs text-primary">📞 {m.mobile}</p>}
                          {m.govJob === 'Yes' && <p className="text-xs">🏛 {m.govJobPlace}</p>}
                        </div>
                      </div>
                    ))}
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

export default AdminPanel;
