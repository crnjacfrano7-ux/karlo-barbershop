import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, isPast, isToday, parseISO } from 'date-fns';
import { hr } from 'date-fns/locale';
import { Calendar, Clock, Scissors, ChevronLeft, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Appointment } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export default function MyReservations() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!authLoading && !user) {
      navigate('/login');
      return;
    }
    if (user) fetchAppointments();
  }, [user, authLoading, navigate]);

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          barber:barbers(name, avatar_url),
          service:services(name, price, duration_minutes)
        `)
        .eq('user_id', user!.id)
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;
      setAppointments((data as unknown as Appointment[]) || []);
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = async (id: string) => {
    const { error } = await supabase
      .from('appointments')
      .update({ status: 'cancelled' })
      .eq('id', id);
    if (!error) fetchAppointments();
  };

  const now = new Date();
  const todayStr = format(now, 'yyyy-MM-dd');

  const upcoming = appointments.filter(a => {
    if (a.status === 'cancelled') return false;
    return a.appointment_date > todayStr || (a.appointment_date === todayStr && a.appointment_time >= format(now, 'HH:mm:ss'));
  });

  const past = appointments.filter(a => {
    if (a.status === 'cancelled') return false;
    return a.appointment_date < todayStr || (a.appointment_date === todayStr && a.appointment_time < format(now, 'HH:mm:ss'));
  });

  const cancelled = appointments.filter(a => a.status === 'cancelled');

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-primary/15 text-primary border-primary/30';
      case 'pending': return 'bg-yellow-500/15 text-yellow-600 border-yellow-500/30';
      case 'completed': return 'bg-green-500/15 text-green-600 border-green-500/30';
      case 'cancelled': return 'bg-destructive/15 text-destructive border-destructive/30';
      default: return 'bg-muted text-muted-foreground border-border';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'confirmed': return 'Potvrđeno';
      case 'pending': return 'Na čekanju';
      case 'completed': return 'Završeno';
      case 'cancelled': return 'Otkazano';
      default: return status;
    }
  };

  const AppointmentCard = ({ appointment, showCancel = false }: { appointment: Appointment; showCancel?: boolean }) => (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-5"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 space-y-2">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {format(parseISO(appointment.appointment_date), 'EEEE, d. MMMM yyyy.', { locale: hr })}
          </div>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="w-4 h-4" />
            {appointment.appointment_time.slice(0, 5)}
          </div>
          <div className="flex items-center gap-2">
            <Scissors className="w-4 h-4 text-primary" />
            <span className="font-semibold">{appointment.service?.name}</span>
            <span className="text-primary font-bold">{Number(appointment.service?.price).toFixed(2)} KM</span>
          </div>
          {appointment.barber && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="w-4 h-4" />
              {appointment.barber.name}
            </div>
          )}
        </div>
        <div className="flex flex-col items-end gap-2">
          <Badge className={getStatusColor(appointment.status)}>
            {getStatusText(appointment.status)}
          </Badge>
          {showCancel && appointment.status !== 'cancelled' && (
            <Button
              variant="ghost"
              size="sm"
              className="text-destructive hover:text-destructive hover:bg-destructive/10 text-xs"
              onClick={() => handleCancel(appointment.id)}
            >
              Otkaži
            </Button>
          )}
        </div>
      </div>
    </motion.div>
  );

  const EmptyState = ({ message }: { message: string }) => (
    <div className="text-center py-12">
      <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
      <p className="text-muted-foreground">{message}</p>
    </div>
  );

  if (authLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="bg-card border-b border-border sticky top-0 z-50">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Link to="/" className="flex items-center gap-2">
                <img src="/favicon.png" alt="Meštar" className="w-8 h-8 object-contain" />
                <span className="font-serif text-xl font-bold">Meštar</span>
              </Link>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm font-medium">Moje Rezervacije</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Povratak
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <h1 className="text-3xl font-serif font-bold mb-6">Moje Rezervacije</h1>

          <Tabs defaultValue="upcoming">
            <TabsList className="w-full mb-6">
              <TabsTrigger value="upcoming" className="flex-1">
                Nadolazeće ({upcoming.length})
              </TabsTrigger>
              <TabsTrigger value="past" className="flex-1">
                Prošle ({past.length})
              </TabsTrigger>
              <TabsTrigger value="cancelled" className="flex-1">
                Otkazane ({cancelled.length})
              </TabsTrigger>
            </TabsList>

            <TabsContent value="upcoming">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
                </div>
              ) : upcoming.length === 0 ? (
                <EmptyState message="Nemate nadolazećih rezervacija." />
              ) : (
                <div className="space-y-3">
                  {upcoming.map(a => <AppointmentCard key={a.id} appointment={a} showCancel />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="past">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
                </div>
              ) : past.length === 0 ? (
                <EmptyState message="Nemate prošlih rezervacija." />
              ) : (
                <div className="space-y-3">
                  {past.map(a => <AppointmentCard key={a.id} appointment={a} />)}
                </div>
              )}
            </TabsContent>

            <TabsContent value="cancelled">
              {loading ? (
                <div className="flex justify-center py-12">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
                </div>
              ) : cancelled.length === 0 ? (
                <EmptyState message="Nemate otkazanih rezervacija." />
              ) : (
                <div className="space-y-3">
                  {cancelled.map(a => <AppointmentCard key={a.id} appointment={a} />)}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </motion.div>
      </main>
    </div>
  );
}
