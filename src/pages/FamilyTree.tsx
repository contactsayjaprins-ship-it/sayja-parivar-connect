import { useEffect, useMemo, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { fetchAllProfiles } from '@/lib/api';
import { FamilyProfile } from '@/lib/store';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ReactFlow, { Background, Controls, Edge, Node, Position } from 'reactflow';
import 'reactflow/dist/style.css';

const FamilyTree = () => {
  const navigate = useNavigate();
  const [profiles, setProfiles] = useState<FamilyProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedId, setSelectedId] = useState<string>('');

  useEffect(() => {
    (async () => {
      try {
        const list = await fetchAllProfiles();
        setProfiles(list);
        if (list.length > 0) setSelectedId(list[0].id);
      } catch (err: any) {
        toast({ title: 'ભૂલ', description: err.message, variant: 'destructive' });
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const selected = profiles.find(p => p.id === selectedId);

  const { nodes, edges } = useMemo(() => {
    const nodes: Node[] = [];
    const edges: Edge[] = [];
    if (!selected) return { nodes, edges };

    const headId = `head-${selected.id}`;
    nodes.push({
      id: headId,
      data: { label: `👤 ${selected.name} ${selected.surname}\n(મુખ્ય)` },
      position: { x: 400, y: 40 },
      style: {
        background: 'hsl(var(--primary))',
        color: 'hsl(var(--primary-foreground))',
        border: 'none',
        borderRadius: 12,
        padding: 12,
        fontSize: 13,
        whiteSpace: 'pre-line',
        minWidth: 180,
        textAlign: 'center' as const,
      },
      sourcePosition: Position.Bottom,
    });

    const cols = Math.max(selected.members.length, 1);
    selected.members.forEach((m, i) => {
      const id = `m-${m.id}`;
      nodes.push({
        id,
        data: { label: `${m.name}\n(${m.relation || 'સભ્ય'})` },
        position: { x: 60 + i * Math.min(220, 800 / cols), y: 220 },
        style: {
          background: 'hsl(var(--card))',
          border: '2px solid hsl(var(--border))',
          borderRadius: 12,
          padding: 10,
          fontSize: 12,
          whiteSpace: 'pre-line',
          minWidth: 140,
          textAlign: 'center' as const,
        },
        targetPosition: Position.Top,
      });
      edges.push({
        id: `e-${headId}-${id}`,
        source: headId,
        target: id,
        animated: true,
        style: { stroke: 'hsl(var(--primary))' },
      });
    });

    return { nodes, edges };
  }, [selected]);

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold">🌳 ફેમિલી ટ્રી</h1>
            <p className="text-muted-foreground text-sm mt-1">પરિવારની વંશાવળી જુઓ</p>
          </div>
          <div className="flex gap-2 items-center flex-wrap">
            <select
              value={selectedId}
              onChange={e => setSelectedId(e.target.value)}
              className="h-10 rounded-md border border-input bg-background px-3 text-sm min-w-[200px]"
            >
              {profiles.map(p => (
                <option key={p.id} value={p.id}>{p.name} {p.surname} ({p.mobile})</option>
              ))}
            </select>
            {selected && (
              <Button variant="outline" size="sm" onClick={() => navigate(`/id-card/${selected.mobile}`)}>
                🪪 ID Card
              </Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
        ) : !selected ? (
          <p className="text-center text-muted-foreground py-12">કોઈ પરિવાર નથી</p>
        ) : (
          <div className="w-full h-[70vh] rounded-2xl border border-border shadow-card overflow-hidden bg-background">
            <ReactFlow nodes={nodes} edges={edges} fitView fitViewOptions={{ padding: 0.2 }}>
              <Background />
              <Controls />
            </ReactFlow>
          </div>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default FamilyTree;
