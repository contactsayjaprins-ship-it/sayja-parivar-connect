import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import Footer from '@/components/Footer';
import Header from '@/components/Header';

const Index = () => (
  <div className="min-h-screen flex flex-col">
    <Header />
    <main className="flex-1">
      <section className="relative overflow-hidden py-24 sm:py-32">
        <div className="absolute inset-0 gradient-warm opacity-50" />
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="max-w-2xl mx-auto space-y-6"
          >
            <h1 className="text-4xl sm:text-6xl font-bold tracking-tight">
              <span className="gradient-primary bg-clip-text" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
                સાજા પરિવાર
              </span>
            </h1>
            <p className="text-xl text-muted-foreground">પરિવાર ની સંપૂર્ણ વિગત</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
              <Link to="/login">
                <Button size="lg" className="gradient-primary text-primary-foreground border-0 shadow-elevated text-lg px-8">
                  ➕ નવી માહિતી ઉમેરો
                </Button>
              </Link>
              <Link to="/ocr">
                <Button size="lg" variant="outline" className="text-lg px-8">
                  📷 ફોર્મનો ફોટો અપલોડ કરો
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <section className="py-16 container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[
            { icon: '📝', title: 'સરળ ફોર્મ', desc: 'ગુજરાતીમાં પરિવારની વિગત ભરો' },
            { icon: '📷', title: 'OCR ટેકનોલોજી', desc: 'ફોટોમાંથી ડેટા ઓટોમેટિક ભરો' },
            { icon: '📊', title: 'Excel એક્સપોર્ટ', desc: 'તમામ ડેટા Excel માં ડાઉનલોડ કરો' },
          ].map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + i * 0.1 }}
              className="bg-card rounded-2xl p-6 shadow-card border border-border text-center space-y-3"
            >
              <span className="text-4xl">{item.icon}</span>
              <h3 className="text-lg font-semibold">{item.title}</h3>
              <p className="text-muted-foreground text-sm">{item.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className="py-16 bg-card border-t border-border">
        <div className="container mx-auto px-4 text-center space-y-4">
          <h2 className="text-2xl font-bold">📞 સંપર્ક</h2>
          <p className="text-lg font-semibold">ER. Prins Sayja</p>
          <p className="text-muted-foreground">📞 +91 8140805960</p>
          <a
            href="https://wa.me/918140805960"
            className="inline-block px-6 py-2 rounded-lg bg-green-600 text-white font-medium hover:bg-green-700 transition-colors"
          >
            WhatsApp કરો
          </a>
        </div>
      </section>
    </main>
    <Footer />
  </div>
);

export default Index;
