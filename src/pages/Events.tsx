import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { fetchEvents, createEvent, deleteEvent } from '@/lib/api';
import { CommunityEvent, useAppStore } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Loader2, Plus, Trash2 } from 'lucide-react';
import { motion } from 'framer-motion';

const TYPE_LABEL: Record<string, string> = {
  marriage: '💍 લગ્ન', death: '🕊️ સ્મરણ', function: '🎉 પ્રસંગ', other: '📌 અન્ય',
};

const Events = () => {
  const { isAdmin } = useAppStore();
  const [events, setEvents] = useState<CommunityEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState<Omit<CommunityEvent, 'id' | 'createdAt'>>({
    title: '', description: '', eventType: 'function', eventDate: new Date().toISOString().slice(0, 10),
    village: '', familyId: null, photo: '',
  });

  const reload = async () => {
    setLoading(true);
    try { setEvents(await fetchEvents()); }
    catch (e: any) { toast({ title: 'ભૂલ', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, []);

  const handleCreate = async () => {
    if (!form.title.trim() || !form.eventDate) {
      toast({ title: 'ભૂલ', description: 'શીર્ષક અને તારીખ જરૂરી છે', variant: 'destructive' });
      return;
    }
    try {
      await createEvent(form);
      toast({ title: '✅ સાચવ્યું' });
      setOpen(false);
      setForm({ ...form, title: '', description: '', village: '' });
      await reload();
    } catch (e: any) {
      toast({ title: 'ભૂલ', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('ડિલીટ કરવું?')) return;
    try { await deleteEvent(id); await reload(); toast({ title: 'ડિલીટ' }); }
    catch (e: any) { toast({ title: 'ભૂલ', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-6">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">🎉 પ્રસંગો / નોટિસ</h1>
            <p className="text-muted-foreground text-sm mt-1">સમુદાયના લગ્ન, સ્મરણ, કાર્યક્રમો</p>
          </div>
          {isAdmin && (
            <Button onClick={() => setOpen(true)} className="gradient-primary text-primary-foreground border-0">
              <Plus className="w-4 h-4 mr-1" /> નવો પ્રસંગ
            </Button>
          )}
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : events.length === 0 ? (
          <p className="text-center text-muted-foreground py-12">હજી કોઈ પ્રસંગ નથી</p>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {events.map((e, i) => (
              <motion.div
                key={e.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: Math.min(i * 0.04, 0.3) }}
                className="bg-card border border-border rounded-2xl p-4 shadow-card space-y-2 relative"
              >
                {isAdmin && (
                  <button onClick={() => handleDelete(e.id)} className="absolute top-3 right-3 text-destructive p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                )}
                <div className="text-xs px-2 py-0.5 rounded-full bg-primary/10 text-primary inline-block">
                  {TYPE_LABEL[e.eventType] || e.eventType}
                </div>
                <h3 className="font-bold text-lg pr-6">{e.title}</h3>
                <p className="text-sm text-muted-foreground">📅 {new Date(e.eventDate).toLocaleDateString('gu-IN', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
                {e.village && <p className="text-sm text-muted-foreground">📍 {e.village}</p>}
                {e.description && <p className="text-sm whitespace-pre-line">{e.description}</p>}
              </motion.div>
            ))}
          </div>
        )}
      </main>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>નવો પ્રસંગ ઉમેરો</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>શીર્ષક *</Label><Input value={form.title} onChange={e => setForm({ ...form, title: e.target.value })} /></div>
            <div><Label>પ્રકાર</Label>
              <select value={form.eventType} onChange={e => setForm({ ...form, eventType: e.target.value as any })}
                className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
                <option value="marriage">લગ્ન</option>
                <option value="death">સ્મરણ</option>
                <option value="function">પ્રસંગ</option>
                <option value="other">અન્ય</option>
              </select>
            </div>
            <div><Label>તારીખ *</Label><Input type="date" value={form.eventDate} onChange={e => setForm({ ...form, eventDate: e.target.value })} /></div>
            <div><Label>ગામ</Label><Input value={form.village} onChange={e => setForm({ ...form, village: e.target.value })} /></div>
            <div><Label>વર્ણન</Label><Textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={3} /></div>
            <Button onClick={handleCreate} className="w-full gradient-primary text-primary-foreground border-0">સાચવો</Button>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Events;
