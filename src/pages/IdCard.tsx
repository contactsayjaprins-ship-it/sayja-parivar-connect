import { useEffect, useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Loader2, Download } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { FamilyProfile } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import QRCode from 'qrcode';
import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';

const IdCard = () => {
  const { mobile } = useParams();
  const navigate = useNavigate();
  const [profile, setProfile] = useState<FamilyProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [qr, setQr] = useState('');
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    (async () => {
      try {
        const { data, error } = await supabase
          .from('families')
          .select('*, family_members(*)')
          .eq('mobile', mobile)
          .maybeSingle();
        if (error) throw error;
        if (!data) { toast({ title: 'મળ્યું નહીં', variant: 'destructive' }); navigate('/families'); return; }
        const p: FamilyProfile = {
          id: data.id, familyCode: data.family_code, name: data.name, surname: data.surname,
          mobile: data.mobile, email: data.email || '', nativeVillage: data.native_village || '',
          currentVillage: data.current_village || '', occupation: data.occupation || '',
          govJob: (data.gov_job as any) || 'No', govJobPlace: data.gov_job_place || '',
          education: data.education || '', totalMembers: data.total_members || 1,
          address: data.address || '', profilePhoto: data.profile_photo || '',
          formPhoto: data.form_photo || '', housePhoto: data.house_photo || '',
          lat: data.lat, lng: data.lng, bloodGroup: data.blood_group || '',
          categoryTag: data.category_tag || '',
          gallery: Array.isArray(data.gallery) ? (data.gallery as any) : [],
          createdAt: data.created_at, updatedAt: data.updated_at,
          members: ((data as any).family_members || []).map((m: any) => ({
            id: m.id, name: m.name || '', relation: m.relation || '', occupation: m.occupation || '',
            govJob: m.gov_job || 'No', govJobPlace: m.gov_job_place || '', education: m.education || '',
            mobile: m.mobile || '', gender: m.gender || 'પુરુષ', photo: m.photo || '',
            bloodGroup: m.blood_group || '',
          })),
        };
        setProfile(p);
        const url = `${window.location.origin}/families?fid=${p.id}`;
        setQr(await QRCode.toDataURL(url, { width: 200, margin: 1 }));
      } catch (err: any) {
        toast({ title: 'ભૂલ', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, [mobile, navigate]);

  const downloadPdf = async () => {
    if (!cardRef.current || !profile) return;
    try {
      const canvas = await html2canvas(cardRef.current, { scale: 3, useCORS: true, backgroundColor: '#ffffff' });
      const img = canvas.toDataURL('image/jpeg', 0.95);
      const pdf = new jsPDF({ orientation: 'landscape', unit: 'pt', format: [620, 380] });
      pdf.addImage(img, 'JPEG', 0, 0, 620, 380);
      pdf.save(`${profile.familyCode || profile.mobile}_IDCard.pdf`);
    } catch (e: any) {
      toast({ title: 'ભૂલ', description: e.message, variant: 'destructive' });
    }
  };

  if (loading) return (
    <div className="min-h-screen flex flex-col"><Header />
      <main className="flex-1 flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin text-primary" /></main>
      <Footer />
    </div>
  );
  if (!profile) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-4">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <h1 className="text-2xl font-bold">🪪 ડિજિટલ ID કાર્ડ</h1>
          <Button onClick={downloadPdf} className="gradient-primary text-primary-foreground border-0">
            <Download className="w-4 h-4 mr-2" /> PDF ડાઉનલોડ
          </Button>
        </div>

        <div className="overflow-auto">
          <div
            ref={cardRef}
            className="mx-auto bg-white text-slate-900 border-4 border-orange-500 rounded-2xl shadow-elevated"
            style={{ width: 620, height: 380, padding: 24, fontFamily: "'Noto Sans Gujarati',sans-serif" }}
          >
            <div className="flex items-center justify-between border-b-2 border-orange-400 pb-3">
              <div>
                <p className="text-xs uppercase tracking-wider text-orange-600">સાયજા પરિવાર સમુદાય</p>
                <h2 className="text-2xl font-extrabold bg-gradient-to-r from-orange-500 to-red-500 bg-clip-text text-transparent">
                  Sayja Parivar ID Card
                </h2>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-slate-500">Family Code</p>
                <p className="text-lg font-bold text-orange-600">{profile.familyCode || '-'}</p>
              </div>
            </div>

            <div className="flex gap-4 mt-4">
              <div className="w-28 h-28 rounded-xl overflow-hidden border-2 border-orange-300 bg-slate-100 flex items-center justify-center">
                {profile.profilePhoto
                  ? <img src={profile.profilePhoto} crossOrigin="anonymous" alt="" className="w-full h-full object-cover" />
                  : <span className="text-4xl">👤</span>}
              </div>
              <div className="flex-1 text-sm space-y-1">
                <p className="text-lg font-bold">{profile.name} {profile.surname}</p>
                <p>📞 {profile.mobile}</p>
                <p>📍 {profile.nativeVillage} → {profile.currentVillage}</p>
                <p>💼 {profile.occupation || '-'}</p>
                {profile.bloodGroup && <p className="text-red-600 font-semibold">🩸 Blood: {profile.bloodGroup}</p>}
                <p className="text-xs text-slate-500">સભ્ય: {profile.members.length + 1}</p>
              </div>
              <div className="w-28 h-28 flex flex-col items-center justify-center">
                {qr && <img src={qr} alt="QR" className="w-24 h-24" />}
                <p className="text-[9px] text-slate-500 mt-1">Scan to view</p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-dashed border-orange-300 text-center">
              <p className="text-[10px] text-slate-500">આ કાર્ડ સાયજા પરિવાર સમુદાય દ્વારા જારી કરવામાં આવ્યું છે</p>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default IdCard;
