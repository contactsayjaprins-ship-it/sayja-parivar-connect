import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const FEATURES = [
  { icon: '📞', title: 'વ્યક્તિ ડિરેક્ટરી', desc: 'સ્માર્ટ સર્ચ + વોઇસ', to: '/directory' },
  { icon: '🏠', title: 'પરિવારો', desc: 'કાર્ડ + વિગતો', to: '/families' },
  { icon: '🗺️', title: 'નકશો', desc: 'OpenStreetMap free', to: '/map' },
  { icon: '🌳', title: 'ફેમિલી ટ્રી', desc: 'વંશાવળી', to: '/tree' },
  { icon: '🎉', title: 'પ્રસંગો', desc: 'સમુદાયના કાર્યક્રમો', to: '/events' },
];

const Index = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <section className="relative overflow-hidden py-20 sm:py-28">
        <div className="absolute inset-0 gradient-warm opacity-50" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-3xl mx-auto space-y-6"
          >
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              <span className="gradient-primary bg-clip-text" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                સાયજા પરિવાર
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">સંપૂર્ણ સમુદાય પ્લેટફોર્મ — નકશો, ડિરેક્ટરી, ID કાર્ડ, પ્રસંગો</p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 flex-wrap">
              <Link to="/login">
                <Button size="lg" className="gradient-primary text-primary-foreground border-0 shadow-elevated text-lg px-8 py-6">
                  ➕ નવી માહિતી ઉમેરો
                </Button>
              </Link>
              <Link to="/directory">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">📞 ડિરેક્ટરી</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">📋 સુવિધાઓ</h2>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {FEATURES.map((f, i) => (
            <Link key={f.to} to={f.to}>
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + i * 0.08 }}
                whileHover={{ y: -4 }}
                className="bg-card rounded-2xl p-5 shadow-card border border-border text-center space-y-2 cursor-pointer h-full"
              >
                <div className="text-4xl">{f.icon}</div>
                <h3 className="font-semibold">{f.title}</h3>
                <p className="text-muted-foreground text-xs">{f.desc}</p>
              </motion.div>
            </Link>
          ))}
        </div>

        <div className="mt-12 max-w-3xl mx-auto bg-secondary/40 border border-border rounded-2xl p-6 text-center">
          <p className="text-base sm:text-lg font-medium">
            🔒 તમારી માહિતી સુરક્ષિત રીતે સંગ્રહિત છે
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            🎤 દરેક ફીલ્ડમાં માઇક બટન છે • 🩸 બ્લડ ગ્રુપ • 🪪 ડિજિટલ ID • 🌳 ફેમિલી ટ્રી
          </p>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Index;
