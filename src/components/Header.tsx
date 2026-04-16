import { Link, useNavigate } from 'react-router-dom';
import { useAppStore } from '@/lib/store';
import { Button } from '@/components/ui/button';
import { motion } from 'framer-motion';

const Header = () => {
  const { currentUser, isAdmin, logout } = useAppStore();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <motion.header
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      className="sticky top-0 z-50 bg-card/80 backdrop-blur-md border-b border-border"
    >
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2">
          <span className="text-xl font-bold gradient-primary bg-clip-text text-transparent" style={{ WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            સાજા પરિવાર
          </span>
        </Link>
        <nav className="flex items-center gap-3">
          {currentUser ? (
            <>
              <Link to="/profile">
                <Button variant="ghost" size="sm">પ્રોફાઇલ</Button>
              </Link>
              {isAdmin && (
                <Link to="/admin">
                  <Button variant="ghost" size="sm">એડમિન</Button>
                </Link>
              )}
              <Button variant="outline" size="sm" onClick={handleLogout}>
                લોગઆઉટ
              </Button>
            </>
          ) : (
            <Link to="/login">
              <Button size="sm" className="gradient-primary text-primary-foreground border-0">
                લોગિન
              </Button>
            </Link>
          )}
        </nav>
      </div>
    </motion.header>
  );
};

export default Header;
