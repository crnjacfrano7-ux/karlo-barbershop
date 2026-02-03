import { useState, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Header } from '@/components/Header';
import { Hero } from '@/components/Hero';
import { ServicesSection } from '@/components/ServicesSection';
import { BarbersSection } from '@/components/BarbersSection';
import { BookingFlow } from '@/components/BookingFlow';
import { Footer } from '@/components/Footer';
import { Service } from '@/types/database';
import { X } from 'lucide-react';
import { Button } from '@/components/ui/button';

const Index = () => {
  const navigate = useNavigate();
  const [showBooking, setShowBooking] = useState(false);
  const bookingRef = useRef<HTMLDivElement>(null);

  const handleBookNow = () => {
    setShowBooking(true);
    setTimeout(() => {
      bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleServiceSelect = (service: Service) => {
    setShowBooking(true);
    setTimeout(() => {
      bookingRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  };

  const handleAuthRequired = () => {
    navigate('/login', { state: { returnTo: '/' } });
  };

  const handleBookingComplete = () => {
    setShowBooking(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <main>
        <Hero onBookNow={handleBookNow} />
        <ServicesSection onSelectService={handleServiceSelect} />
        <BarbersSection />

        {/* Booking Section */}
        {showBooking && (
          <motion.section
            ref={bookingRef}
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            className="py-24 bg-card relative"
          >
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowBooking(false)}
              className="absolute top-4 right-4"
            >
              <X className="w-6 h-6" />
            </Button>
            <div className="container mx-auto px-4">
              <div className="text-center mb-12">
                <span className="text-primary text-sm font-medium uppercase tracking-wider">
                  Rezerviraj Sada
                </span>
                <h2 className="text-4xl md:text-5xl font-serif font-bold mt-3">
                  Rezerviraj Termin
                </h2>
              </div>
              <BookingFlow
                onComplete={handleBookingComplete}
                onAuthRequired={handleAuthRequired}
              />
            </div>
          </motion.section>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default Index;
