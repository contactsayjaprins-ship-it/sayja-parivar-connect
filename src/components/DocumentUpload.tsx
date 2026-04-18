import { useEffect, useRef, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { uploadDocument, listDocuments, getDocumentUrl, deleteDocument } from '@/lib/api';
import { toast } from '@/hooks/use-toast';
import { Loader2, FileText, Trash2, Eye, Upload } from 'lucide-react';

interface Doc {
  id: string;
  family_id: string;
  doc_type: string;
  label: string;
  storage_path: string;
  created_at: string;
}

const DocumentUpload = ({ familyId }: { familyId: string }) => {
  const [docs, setDocs] = useState<Doc[]>([]);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [docType, setDocType] = useState('aadhaar');
  const [label, setLabel] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const reload = async () => {
    try { setDocs((await listDocuments(familyId)) as any); }
    catch (e: any) { toast({ title: 'ભૂલ', description: e.message, variant: 'destructive' }); }
    finally { setLoading(false); }
  };
  useEffect(() => { reload(); }, [familyId]);

  const handleFile = async (file: File) => {
    setUploading(true);
    try {
      await uploadDocument(file, familyId, docType, label || file.name);
      toast({ title: '✅ અપલોડ થયું' });
      setLabel('');
      await reload();
    } catch (e: any) {
      toast({ title: 'ભૂલ', description: e.message, variant: 'destructive' });
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const handleView = async (path: string) => {
    try {
      const url = await getDocumentUrl(path);
      window.open(url, '_blank');
    } catch (e: any) {
      toast({ title: 'ભૂલ', description: e.message, variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string, path: string) => {
    if (!confirm('ડિલીટ કરવું?')) return;
    try { await deleteDocument(id, path); await reload(); toast({ title: 'ડિલીટ' }); }
    catch (e: any) { toast({ title: 'ભૂલ', description: e.message, variant: 'destructive' }); }
  };

  return (
    <div className="space-y-3">
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 items-end">
        <div>
          <Label>દસ્તાવેજ પ્રકાર</Label>
          <select value={docType} onChange={e => setDocType(e.target.value)}
            className="w-full h-10 rounded-md border border-input bg-background px-3 text-sm">
            <option value="aadhaar">આધાર</option>
            <option value="pan">પાન કાર્ડ</option>
            <option value="education">શિક્ષણ સર્ટિ.</option>
            <option value="ration">રાશન કાર્ડ</option>
            <option value="other">અન્ય</option>
          </select>
        </div>
        <div>
          <Label>લેબલ (વૈકલ્પિક)</Label>
          <Input value={label} onChange={e => setLabel(e.target.value)} placeholder="દા.ત. પિતાનું આધાર" />
        </div>
        <div>
          <input
            ref={fileRef}
            type="file"
            accept="image/*,application/pdf"
            className="hidden"
            onChange={e => e.target.files?.[0] && handleFile(e.target.files[0])}
          />
          <Button
            type="button"
            disabled={uploading}
            onClick={() => fileRef.current?.click()}
            className="w-full gradient-primary text-primary-foreground border-0"
          >
            {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Upload className="w-4 h-4 mr-1" /> અપલોડ</>}
          </Button>
        </div>
      </div>

      {loading ? (
        <Loader2 className="w-5 h-5 animate-spin text-primary mx-auto" />
      ) : docs.length === 0 ? (
        <p className="text-center text-muted-foreground text-sm py-4">હજી કોઈ દસ્તાવેજ નથી</p>
      ) : (
        <div className="space-y-2">
          {docs.map(d => (
            <div key={d.id} className="flex items-center gap-2 bg-secondary/40 border border-border rounded-lg p-2">
              <FileText className="w-5 h-5 text-primary flex-shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{d.label || d.storage_path.split('/').pop()}</p>
                <p className="text-xs text-muted-foreground">{d.doc_type} • {new Date(d.created_at).toLocaleDateString('gu-IN')}</p>
              </div>
              <Button size="sm" variant="ghost" onClick={() => handleView(d.storage_path)}><Eye className="w-4 h-4" /></Button>
              <Button size="sm" variant="ghost" onClick={() => handleDelete(d.id, d.storage_path)}>
                <Trash2 className="w-4 h-4 text-destructive" />
              </Button>
            </div>
          ))}
        </div>
      )}
      <p className="text-xs text-muted-foreground">🔒 દસ્તાવેજો સુરક્ષિત રીતે સંગ્રહિત છે (signed URL — ૧ કલાક માટે જ ખુલે)</p>
    </div>
  );
};

export default DocumentUpload;
