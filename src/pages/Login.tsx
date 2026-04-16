import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAppStore, ADMIN_MOBILE } from '@/lib/store';
import { loginByMobile } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { motion } from 'framer-motion';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { toast } from '@/hooks/use-toast';
import { Loader2 } from 'lucide-react';

const Login = () => {
  const [mobile, setMobile] = useState('');
  const [loading, setLoading] = useState(false);
  const { setCurrentUser, setIsAdmin } = useAppStore();
  const navigate = useNavigate();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const cleaned = mobile.replace(/\D/g, '').slice(-10);
    if (cleaned.length < 10) {
      toast({ title: 'ભૂલ', description: 'કૃપા કરી 10 અંકનો મોબાઇલ નંબર દાખલ કરો', variant: 'destructive' });
      return;
    }
    setLoading(true);
    try {
      const profile = await loginByMobile(cleaned);
      setCurrentUser(profile);
      setIsAdmin(cleaned === ADMIN_MOBILE);
      toast({ title: 'સફળતા', description: 'લોગિન સફળ!' });
      navigate(cleaned === ADMIN_MOBILE ? '/admin' : '/profile');
    } catch (err: any) {
      toast({ title: 'ભૂલ', description: err.message || 'લોગિન ફેઇલ', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-md bg-card rounded-2xl shadow-elevated border border-border p-8 space-y-6"
        >
          <div className="text-center space-y-2">
            <h1 className="text-2xl font-bold">🔐 લોગિન</h1>
            <p className="text-muted-foreground text-sm">મોબાઇલ નંબર દાખલ કરો</p>
          </div>
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <Label>મોબાઇલ નંબર</Label>
              <Input
                type="tel"
                placeholder="9876543210"
                value={mobile}
                onChange={e => setMobile(e.target.value)}
                maxLength={13}
                className="text-lg text-center tracking-wider"
                disabled={loading}
              />
            </div>
            <Button type="submit" disabled={loading} className="w-full gradient-primary text-primary-foreground border-0 text-lg">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'લોગિન કરો'}
            </Button>
          </form>
          <p className="text-xs text-center text-muted-foreground">
            નવા છો? નંબર દાખલ કરો - ઓટોમેટિક પ્રોફાઇલ બનશે
          </p>
        </motion.div>
      </main>
      <Footer />
    </div>
  );
};

export default Login;
