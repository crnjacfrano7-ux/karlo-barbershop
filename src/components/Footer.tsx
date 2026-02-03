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
              <Scissors className="w-8 h-8 text-primary" />
              <span className="font-serif text-xl font-bold">The Cut Lab</span>
            </Link>
            <p className="text-muted-foreground text-sm">
              Premium barbershop experience with expert barbers and modern styling.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="font-serif font-semibold mb-4">Quick Links</h4>
            <ul className="space-y-2">
              <li>
                <a href="#services" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Services
                </a>
              </li>
              <li>
                <a href="#barbers" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Our Team
                </a>
              </li>
              <li>
                <Link to="/login" className="text-muted-foreground hover:text-primary transition-colors text-sm">
                  Sign In
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h4 className="font-serif font-semibold mb-4">Contact</h4>
            <ul className="space-y-3">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <MapPin className="w-4 h-4 text-primary" />
                123 Style Street, NY 10001
              </li>
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Phone className="w-4 h-4 text-primary" />
                (555) 123-4567
              </li>
            </ul>
          </div>

          {/* Hours */}
          <div>
            <h4 className="font-serif font-semibold mb-4">Hours</h4>
            <ul className="space-y-2">
              <li className="flex items-center gap-2 text-muted-foreground text-sm">
                <Clock className="w-4 h-4 text-primary" />
                <span>Mon - Fri: 9AM - 7PM</span>
              </li>
              <li className="text-muted-foreground text-sm pl-6">
                Sat: 9AM - 6PM
              </li>
              <li className="text-muted-foreground text-sm pl-6">
                Sun: 10AM - 4PM
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-border mt-12 pt-8 text-center text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} The Cut Lab. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
}
