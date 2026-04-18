import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';
import { useState } from 'react';
import { Menu, X } from 'lucide-react';

const Header = () => {
  const { currentUser, isAdmin, logout } = useAppStore();
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
    navigate('/');
  };

  const close = () => setOpen(false);

  const navLinks = (
    <>
      <Link to="/directory" onClick={close}><Button variant="ghost" size="sm">📞 ડિરેક્ટરી</Button></Link>
      <Link to="/families" onClick={close}><Button variant="ghost" size="sm">🏠 પરિવારો</Button></Link>
      <Link to="/map" onClick={close}><Button variant="ghost" size="sm">🗺️ નકશો</Button></Link>
      <Link to="/tree" onClick={close}><Button variant="ghost" size="sm">🌳 ટ્રી</Button></Link>
      <Link to="/events" onClick={close}><Button variant="ghost" size="sm">🎉 પ્રસંગો</Button></Link>
      {currentUser ? (
        <>
          <Link to="/profile" onClick={close}><Button variant="ghost" size="sm">પ્રોફાઇલ</Button></Link>
          {isAdmin && <Link to="/admin" onClick={close}><Button variant="ghost" size="sm">👑 એડમિન</Button></Link>}
          <Button variant="outline" size="sm" onClick={handleLogout}>લોગઆઉટ</Button>
        </>
      ) : (
        <Link to="/login" onClick={close}>
          <Button size="sm" className="gradient-primary text-primary-foreground border-0">લોગિન</Button>
        </Link>
      )}
    </>
  );

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold gradient-primary bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            સાયજા પરિવાર
          </span>
        </Link>
        <nav className="hidden lg:flex items-center gap-1">{navLinks}</nav>
        <button className="lg:hidden p-2" onClick={() => setOpen(o => !o)} aria-label="Menu">
          {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      </div>
      {open && (
        <div className="lg:hidden border-t border-border bg-card/95 backdrop-blur-md">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-2 items-stretch">
            {navLinks}
          </nav>
        </div>
      )}
    </motion.header>
  );
};

export default Header;
