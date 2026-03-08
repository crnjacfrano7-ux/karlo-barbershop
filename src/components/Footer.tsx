import { Scissors, MapPin, Phone, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';

export function Footer() {
  return (
    <footer className="bg-card border-t border-border py-16">
      <div className="container mx-auto px-4">
        <div className="grid gap-12 md:grid-cols-4">
          {/* Brand */}
          <div className="md:col-span-1">
            <Link to="/" className="flex items-center gap-2 mb-4">
              <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-8 h-8 text-primary"><circle cx="6" cy="6" r="3"></circle><path d="M8.12 8.12 12 12"></path><path d="M20 4 8.12 15.88"></path><circle cx="6" cy="18" r="3"></circle><path d="M14.8 14.8 20 20"></path></svg>
              <span className="font-serif text-xl font-bold">Karlo Barbershop</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Premium frizerski salon s iskusnim frizerom i modernim stilom.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-semibold mb-4">Brzi Linkovi</h4>
            <ul className="space-y-2">
              <li>
                <a href="#services" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Usluge
                </a>
              </li>
              <li>
                <a href="#barbers" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Naš Tim
                </a>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Prijava
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-semibold mb-4">Kontakt</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">čitluk
                <MapPin className="w-4 h-4 text-primary" />
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">063 608 636
                <Phone className="w-4 h-4 text-primary" />
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-serif font-semibold mb-4">Radno Vrijeme</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>Pon - Sub: 8:00 - 19:00</span>
              </li>
              
              <li className="text-muted-foreground text-sm pl-6">
                Ned: Zatvoreno
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" className="w-8 h-8 text-primary mx-auto mb-2"><circle cx="6" cy="6" r="3"></circle><path d="M8.12 8.12 12 12"></path><path d="M20 4 8.12 15.88"></path><circle cx="6" cy="18" r="3"></circle><path d="M14.8 14.8 20 20"></path></svg>
          <p>&copy; {new Date().getFullYear()} Karlo Barbershop. Sva prava pridržana.</p>
        </div>
      </div>
    </footer>);

}