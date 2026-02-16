import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Check, Calendar, User, Scissors } from 'lucide-react';
import { format, isSaturday } from 'date-fns';
import { hr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';
import { Service, Barber, BookingState } from '@/types/database';
import { Button } from './ui/button';
import { ServiceCard } from './ServiceCard';
import { BarberCard } from './BarberCard';
import { DatePicker } from './DatePicker';
import { TimeSlotPicker } from './TimeSlotPicker';

const steps = [
  { id: 1, title: 'Odaberi Uslugu', icon: Scissors },
  { id: 2, title: 'Odaberi Frizera', icon: User },
  { id: 3, title: 'Datum i Vrijeme', icon: Calendar },
  { id: 4, title: 'Potvrda', icon: Check },
];

interface BookingFlowProps {
  onComplete: () => void;
  onAuthRequired: () => void;
}

export function BookingFlow({ onComplete, onAuthRequired }: BookingFlowProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  const [booking, setBooking] = useState<BookingState>({
    step: 1,
    service: null,
    barber: null,
    date: null,
    time: null,
  });
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchServices();
    fetchBarbers();
  }, []);

  useEffect(() => {
    if (booking.barber && booking.date) {
      fetchBookedSlots();
    }
  }, [booking.barber, booking.date]);

  const fetchServices = async () => {
    const { data, error } = await supabase
      .from('services')
      .select('*')
      .eq('is_active', true)
      .order('price');

    if (!error && data) {
      setServices(data);
    }
  };

  const fetchBarbers = async () => {
    const { data, error } = await supabase
      .from('barbers')
      .select('*')
      .eq('is_active', true);

    if (!error && data) {
      setBarbers(data);
    }
  };

  const fetchBookedSlots = async () => {
    if (!booking.barber || !booking.date) return;

    const { data, error } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('barber_id', booking.barber.id)
      .eq('appointment_date', format(booking.date, 'yyyy-MM-dd'))
      .neq('status', 'cancelled');

    if (!error && data) {
      setBookedSlots(data.map(a => a.appointment_time));
    }
  };

  const handleNext = () => {
    if (booking.step === 3 && !user) {
      onAuthRequired();
      return;
    }
    if (booking.step < 4) {
      setBooking(prev => ({ ...prev, step: prev.step + 1 }));
    }
  };

  const handleBack = () => {
    if (booking.step > 1) {
      setBooking(prev => ({ ...prev, step: prev.step - 1 }));
    }
  };

  const handleConfirm = async () => {
    if (!user || !booking.service || !booking.barber || !booking.date || !booking.time) {
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.from('appointments').insert({
        user_id: user.id,
        service_id: booking.service.id,
        barber_id: booking.barber.id,
        appointment_date: format(booking.date, 'yyyy-MM-dd'),
        appointment_time: booking.time,
        status: 'confirmed',
      });

      if (error) throw error;

      toast({
        title: 'Rezervacija Potvrđena!',
        description: `Vaš termin kod ${booking.barber.name} je zakazan za ${format(booking.date, 'd. MMMM yyyy.', { locale: hr })} u ${booking.time}.`,
      });
      onComplete();
    } catch (error) {
      toast({
        title: 'Rezervacija Neuspješna',
        description: 'Došlo je do greške pri kreiranju termina. Molimo pokušajte ponovo.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = () => {
    switch (booking.step) {
      case 1: return !!booking.service;
      case 2: return !!booking.barber;
      case 3: return !!booking.date && !!booking.time;
      case 4: return true;
      default: return false;
    }
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="max-w-4xl mx-auto">
      {/* Progress Steps */}
      <div className="flex justify-between mb-8 relative">
        <div className="absolute top-5 left-0 right-0 h-0.5 bg-border -z-10" />
        {steps.map((step, index) => {
          const Icon = step.icon;
          const isActive = booking.step === step.id;
          const isCompleted = booking.step > step.id;

          return (
            <div key={step.id} className="flex flex-col items-center">
              <motion.div
                animate={{
                  scale: isActive ? 1.1 : 1,
                  backgroundColor: isCompleted || isActive ? 'hsl(220, 70%, 50%)' : 'hsl(var(--muted))',
                }}
                className="w-10 h-10 rounded-full flex items-center justify-center mb-2"
              >
                {isCompleted ? (
                  <Check className="w-5 h-5 text-primary-foreground" />
                ) : (
                  <Icon className={`w-5 h-5 ${isActive ? 'text-primary-foreground' : 'text-muted-foreground'}`} />
                )}
              </motion.div>
              <span className={`text-xs font-medium hidden sm:block ${isActive ? 'text-primary' : 'text-muted-foreground'}`}>
                {step.title}
              </span>
            </div>
          );
        })}
      </div>

      {/* Step Content */}
      <AnimatePresence mode="wait" custom={1}>
        <motion.div
          key={booking.step}
          custom={1}
          variants={slideVariants}
          initial="enter"
          animate="center"
          exit="exit"
          transition={{ duration: 0.3 }}
        >
          {booking.step === 1 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold mb-6">Odaberi Uslugu</h2>
              <div className="grid gap-4 md:grid-cols-2">
                {services.map(service => (
                  <ServiceCard
                    key={service.id}
                    service={service}
                    selected={booking.service?.id === service.id}
                    onSelect={() => setBooking(prev => ({ ...prev, service }))}
                  />
                ))}
              </div>
            </div>
          )}

          {booking.step === 2 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-serif font-bold mb-6">Odaberi Frizera</h2>
              <div className="grid gap-4 grid-cols-2 md:grid-cols-3">
                {barbers.map(barber => (
                  <BarberCard
                    key={barber.id}
                    barber={barber}
                    selected={booking.barber?.id === barber.id}
                    onSelect={() => setBooking(prev => ({ ...prev, barber }))}
                  />
                ))}
              </div>
            </div>
          )}

          {booking.step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-bold mb-6">Odaberi Datum i Vrijeme</h2>
              <div className="grid gap-6 lg:grid-cols-2">
                <DatePicker
                  selected={booking.date}
                  onSelect={(date) => setBooking(prev => ({ ...prev, date, time: null }))}
                />
                {booking.date && (
                  <TimeSlotPicker
                    selectedTime={booking.time}
                    onSelect={(time) => setBooking(prev => ({ ...prev, time }))}
                    bookedSlots={bookedSlots}
                    isSaturday={isSaturday(booking.date)}
                  />
                )}
              </div>
            </div>
          )}

          {booking.step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-serif font-bold mb-6">Potvrdi Rezervaciju</h2>
              <div className="glass-card p-8">
                <div className="space-y-6">
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Usluga</span>
                    <span className="font-semibold">{booking.service?.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Frizer</span>
                    <span className="font-semibold">{booking.barber?.name}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Datum</span>
                    <span className="font-semibold">
                      {booking.date && format(booking.date, 'EEEE, d. MMMM yyyy.', { locale: hr })}
                    </span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Vrijeme</span>
                    <span className="font-semibold">{booking.time}</span>
                  </div>
                  <div className="flex justify-between items-center pb-4 border-b border-border">
                    <span className="text-muted-foreground">Trajanje</span>
                    <span className="font-semibold">30 minuta</span>
                  </div>
                  <div className="flex justify-between items-center pt-2">
                    <span className="text-lg font-semibold">Ukupno</span>
                    <span className="text-3xl font-bold text-primary">
                      {booking.service?.price} KM
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </motion.div>
      </AnimatePresence>

      {/* Navigation */}
      <div className="flex justify-between mt-8">
        <Button
          variant="outline-gold"
          onClick={handleBack}
          disabled={booking.step === 1}
          className="gap-2"
        >
          <ArrowLeft className="w-4 h-4" />
          Nazad
        </Button>

        {booking.step < 4 ? (
          <Button
            variant="gold"
            onClick={handleNext}
            disabled={!canProceed()}
            className="gap-2"
          >
            {booking.step === 3 && !user ? 'Prijavi se za nastavak' : 'Dalje'}
            <ArrowRight className="w-4 h-4" />
          </Button>
        ) : (
          <Button
            variant="gold"
            onClick={handleConfirm}
            disabled={loading}
            className="gap-2"
          >
            {loading ? 'Rezervacija...' : 'Potvrdi Rezervaciju'}
            <Check className="w-4 h-4" />
          </Button>
        )}
      </div>
    </div>
  );
}
