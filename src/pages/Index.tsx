import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const STEPS = [
  { n: 1, title: 'તમારી માહિતી ભરો', desc: 'નામ, મોબાઇલ, ગામ, વ્યવસાય વગેરે' },
  { n: 2, title: 'પરિવારના સભ્યો ઉમેરો', desc: 'દરેક સભ્યની વિગત અલગ ઉમેરો' },
  { n: 3, title: 'ફોટા અપલોડ કરો', desc: 'મુખ્ય + દરેક સભ્યનો ફોટો' },
  { n: 4, title: 'સેવ બટન દબાવો', desc: 'એક ક્લિકમાં બધું સુરક્ષિત' },
  { n: 5, title: 'PDF ડાઉનલોડ થશે', desc: 'આપોઆપ તમારી ફાઇલ મળશે' },
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
            <p className="text-xl text-muted-foreground">પરિવારની સંપૂર્ણ માહિતી — એક જ જગ્યાએ, સરળ ગુજરાતીમાં</p>
            <p className="text-base text-muted-foreground max-w-2xl mx-auto">
              આ વેબસાઇટ તમારા પરિવારની સંપૂર્ણ માહિતી એક જગ્યાએ સંગ્રહ કરવા માટે બનાવવામાં આવી છે.
              ફોર્મ ભરો, ફોટા અપલોડ કરો અને તમારું પોતાનું PDF મેળવો.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center pt-4 flex-wrap">
              <Link to="/login">
                <Button size="lg" className="gradient-primary text-primary-foreground border-0 shadow-elevated text-lg px-8 py-6">
                  ➕ નવી માહિતી ઉમેરો
                </Button>
              </Link>
              <Link to="/directory">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">📞 ડિરેક્ટરી</Button>
              </Link>
              <Link to="/families">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">🏠 પરિવારો</Button>
              </Link>
              <Link to="/map">
                <Button size="lg" variant="outline" className="text-lg px-8 py-6">🗺️ નકશો</Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10">📋 કેવી રીતે વાપરવું?</h2>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 max-w-5xl mx-auto">
          {STEPS.map((s, i) => (
            <motion.div
              key={s.n}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.1 + i * 0.08 }}
              className="bg-card rounded-2xl p-5 shadow-card border border-border text-center space-y-2"
            >
              <div className="w-10 h-10 mx-auto rounded-full gradient-primary text-primary-foreground flex items-center justify-center text-lg font-bold">
                {s.n}
              </div>
              <h3 className="font-semibold">{s.title}</h3>
              <p className="text-muted-foreground text-xs">{s.desc}</p>
            </motion.div>
          ))}
        </div>

        <div className="mt-12 max-w-3xl mx-auto bg-secondary/40 border border-border rounded-2xl p-6 text-center">
          <p className="text-base sm:text-lg font-medium">
            🔒 તમારી માહિતી સુરક્ષિત રીતે સેવ થાય છે અને પછી તમે તેને ફરી જોઈ શકો છો.
          </p>
          <p className="text-sm text-muted-foreground mt-2">
            🎤 દરેક ફીલ્ડમાં માઇક બટન છે — બોલીને પણ ભરી શકો છો.
          </p>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Index;
