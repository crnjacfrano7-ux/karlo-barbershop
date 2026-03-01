import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Scissors, Menu, X, User, LogOut, LayoutDashboard, CalendarDays } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { Button } from './ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';

export function Header() {
  const navigate = useNavigate();
  const { user, signOut } = useAuth();
  const { isBarber, isAdmin } = useUserRole();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-lg border-b border-border">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link to="/" className="flex items-center gap-2">
            <img src="/favicon.png" alt="Meštar Barber Shop" className="w-10 h-10 object-contain" />
            <span className="font-serif text-xl font-bold">Meštar Barber Shop</span>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-6">
            <Link to="/" className="text-sm font-medium hover:text-primary transition-colors">
              Početna
            </Link>
            <a href="#services" className="text-sm font-medium hover:text-primary transition-colors">
              Usluge
            </a>
            <a href="#barbers" className="text-sm font-medium hover:text-primary transition-colors">
              Naš Tim
            </a>
            
            {user ? (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline-gold" size="sm" className="gap-2">
                    <User className="w-4 h-4" />
                    Račun
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuItem className="text-muted-foreground text-xs">
                    {user.email}
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/my-reservations')}>
                        <CalendarDays className="w-4 h-4 mr-2" />
                        Moje Rezervacije
                      </DropdownMenuItem>
                  {(isBarber || isAdmin) && (
                    <>
                      <DropdownMenuItem onClick={() => navigate('/dashboard')}>
                        <LayoutDashboard className="w-4 h-4 mr-2" />
                        Nadzorna Ploča
                      </DropdownMenuItem>
                    </>
                  )}
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleSignOut}>
                    <LogOut className="w-4 h-4 mr-2" />
                    Odjava
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={() => navigate('/login')}>
                  Prijava
                </Button>
                <Button variant="gold" size="sm" onClick={() => navigate('/signup')}>
                  Rezerviraj
                </Button>
              </div>
            )}
          </nav>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="md:hidden py-4 border-t border-border"
          >
            <nav className="flex flex-col gap-4">
              <Link
                to="/"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Početna
              </Link>
              <a
                href="#services"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Usluge
              </a>
              <a
                href="#barbers"
                className="text-sm font-medium hover:text-primary transition-colors"
                onClick={() => setMobileMenuOpen(false)}
              >
                Naš Tim
              </a>
              
              {user ? (
                <>
                  <Button
                    variant="outline-gold"
                    onClick={() => {
                      navigate('/my-reservations');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Moje Rezervacije
                  </Button>
                  {(isBarber || isAdmin) && (
                    <Button
                      variant="outline-gold"
                      onClick={() => {
                        navigate('/dashboard');
                        setMobileMenuOpen(false);
                      }}
                    >
                      Nadzorna Ploča
                    </Button>
                  )}
                  <Button variant="ghost" onClick={handleSignOut}>
                    Odjava
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="ghost"
                    onClick={() => {
                      navigate('/login');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Prijava
                  </Button>
                  <Button
                    variant="gold"
                    onClick={() => {
                      navigate('/signup');
                      setMobileMenuOpen(false);
                    }}
                  >
                    Rezerviraj
                  </Button>
                </>
              )}
            </nav>
          </motion.div>
        )}
      </div>
    </header>
  );
}
