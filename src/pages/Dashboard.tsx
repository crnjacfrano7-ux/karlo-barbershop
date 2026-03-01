import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { 
  Scissors, Calendar, DollarSign, Users, Clock, ChevronLeft,
  RefreshCw, Plus, Ban, ArrowRightLeft, MoreHorizontal
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Appointment, Service, Barber } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { AddAppointmentDialog } from '@/components/dashboard/AddAppointmentDialog';
import { RescheduleDialog } from '@/components/dashboard/RescheduleDialog';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isBarber, isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null);

  useEffect(() => {
    if (authLoading || roleLoading) return;
    if (!user) { navigate('/login'); return; }
    if (!isBarber && !isAdmin) { navigate('/'); return; }
    fetchAll();
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [user, isBarber, isAdmin, authLoading, roleLoading, navigate]);

  const fetchAll = () => {
    fetchAppointments();
    fetchServices();
    fetchBarbers();
  };

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').eq('is_active', true).order('price');
    if (data) setServices(data);
  };

  const fetchBarbers = async () => {
    const { data } = await supabase.from('barbers').select('*').eq('is_active', true);
    if (data) setBarbers(data);
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('appointments')
        .select(`*, barber:barbers(name, avatar_url), service:services(name, price, duration_minutes)`)
        .eq('appointment_date', today)
        .neq('status', 'cancelled')
        .order('appointment_time');

      if (error) throw error;

      if (data && data.length > 0) {
        const userIds = data.map(a => a.user_id);
        const { data: profiles } = await supabase
          .from('profiles').select('user_id, full_name, phone').in('user_id', userIds);
        setAppointments(data.map(apt => ({
          ...apt,
          profile: profiles?.find(p => p.user_id === apt.user_id),
        })) as unknown as Appointment[]);
      } else {
        setAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching appointments:', error);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    const channel = supabase
      .channel('appointments-changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => fetchAppointments())
      .subscribe();
    return () => { supabase.removeChannel(channel); };
  };

  const handleCancel = async () => {
    if (!cancelAppointment) return;
    try {
      const { error } = await supabase
        .from('appointments')
        .update({ status: 'cancelled' })
        .eq('id', cancelAppointment.id);
      if (error) throw error;
      toast({ title: 'Termin otkazan', description: 'Termin je uspješno otkazan.' });
      fetchAppointments();
    } catch (error) {
      toast({ title: 'Greška', description: 'Nije moguće otkazati termin.', variant: 'destructive' });
    } finally {
      setCancelAppointment(null);
    }
  };

  const totalRevenue = appointments.reduce((sum, apt) => sum + (Number(apt.service?.price) || 0), 0);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'pending': return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      case 'completed': return 'bg-primary/20 text-primary border-primary/30';
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

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Dobro Jutro';
    if (hour < 18) return 'Dobar Dan';
    return 'Dobra Večer';
  };

  if (authLoading || roleLoading) {
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
                <Scissors className="w-8 h-8 text-primary" />
                <span className="font-serif text-xl font-bold">Meštar</span>
              </Link>
              <span className="text-muted-foreground">|</span>
              <span className="text-sm font-medium">Nadzorna Ploča</span>
            </div>
            <Button variant="ghost" size="sm" onClick={() => navigate('/')}>
              <ChevronLeft className="w-4 h-4 mr-1" />
              Povratak
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-serif font-bold">{getGreeting()}</h1>
          <p className="text-muted-foreground">
            Evo vašeg rasporeda za {format(new Date(), 'EEEE, d. MMMM yyyy.', { locale: hr })}
          </p>
        </motion.div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-3 mb-8">
          {[
            { icon: Calendar, label: 'Današnji Termini', value: appointments.length, delay: 0.1 },
            { icon: DollarSign, label: 'Očekivani Prihod', value: `${totalRevenue.toFixed(2)} KM`, delay: 0.2 },
            { icon: Users, label: 'Jedinstveni Klijenti', value: new Set(appointments.map(a => a.user_id)).size, delay: 0.3 },
          ].map(stat => (
            <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: stat.delay }} className="stat-card">
              <div className="flex items-center gap-4">
                <div className="p-3 rounded-lg bg-primary/10">
                  <stat.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">{stat.label}</p>
                  <p className="text-3xl font-bold">{stat.value}</p>
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        {/* Appointments List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold">Popis Termina</h2>
            <div className="flex items-center gap-2">
              <Button variant="gold" size="sm" onClick={() => setShowAddDialog(true)}>
                <Plus className="w-4 h-4 mr-1" />
                Dodaj Termin
              </Button>
              <Button variant="ghost" size="sm" onClick={fetchAppointments}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Osvježi
              </Button>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nema termina danas</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Uživajte u pauzi ili dodajte novi termin.
                </p>
                <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                  <Plus className="w-4 h-4 mr-1" />
                  Dodaj Termin
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {appointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="appointment-row"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2 text-primary font-medium">
                          <Clock className="w-4 h-4" />
                          {appointment.appointment_time.slice(0, 5)}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {appointment.notes?.startsWith('Walk-in:')
                              ? appointment.notes.replace('Walk-in: ', '')
                              : appointment.profile?.full_name || 'Gost'}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.service?.name} • {appointment.barber?.name}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusText(appointment.status)}
                        </Badge>
                        <span className="font-bold text-primary">
                          {Number(appointment.service?.price).toFixed(2)} KM
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => setRescheduleAppointment(appointment)}>
                              <ArrowRightLeft className="w-4 h-4 mr-2" />
                              Premjesti
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setCancelAppointment(appointment)}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Otkaži
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </main>

      {/* Add Appointment Dialog */}
      <AddAppointmentDialog
        open={showAddDialog}
        onOpenChange={setShowAddDialog}
        services={services}
        barbers={barbers}
        onSuccess={fetchAppointments}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        open={!!rescheduleAppointment}
        onOpenChange={(open) => !open && setRescheduleAppointment(null)}
        appointment={rescheduleAppointment}
        barbers={barbers}
        onSuccess={fetchAppointments}
      />

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelAppointment} onOpenChange={(open) => !open && setCancelAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Otkaži Termin</AlertDialogTitle>
            <AlertDialogDescription>
              Jeste li sigurni da želite otkazati termin za{' '}
              <strong>{cancelAppointment?.profile?.full_name || 'Gost'}</strong> u{' '}
              {cancelAppointment?.appointment_time.slice(0, 5)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ne</AlertDialogCancel>
            <AlertDialogAction onClick={handleCancel} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Da, Otkaži
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
