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
              <img src="/favicon.png" alt="Meštar Barber Shop" className="w-10 h-10 object-contain" />
              <span className="font-serif text-xl font-bold">Meštar Barber Shop</span>
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
              <li className="flex items-center gap-2 text-muted-foreground text-sm">Solde 9, Međugorje
                <MapPin className="w-4 h-4 text-primary" />
                Biskupa Čule bb, Mostar
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">063 878-211
                <Phone className="w-4 h-4 text-primary" />
                063 629-436
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-serif font-semibold mb-4">Radno Vrijeme</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>Pon - Pet: 8:30 - 18:00</span>
              </li>
              <li className="text-muted-foreground text-sm pl-6">
                Sub: 8:00 - 14:00
              </li>
              <li className="text-muted-foreground text-sm pl-6">
                Ned: Zatvoreno
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Meštar Barber Shop. Sva prava pridržana.</p>
        </div>
      </div>
    </footer>);

}