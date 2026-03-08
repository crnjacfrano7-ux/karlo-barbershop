import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format } from 'date-fns';
import { hr } from 'date-fns/locale';
import { 
  Scissors, Calendar, Users, Clock, ChevronLeft,
  RefreshCw, Plus, Ban, ArrowRightLeft, MoreHorizontal, CalendarOff,
  History
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Appointment, Service, Barber, BlockedDate, BlockedHour } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { DatePicker } from '@/components/DatePicker';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle
} from '@/components/ui/alert-dialog';
import { AddAppointmentDialog } from '@/components/dashboard/AddAppointmentDialog';
import { RescheduleDialog } from '@/components/dashboard/RescheduleDialog';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, loading: authLoading } = useAuth();
  const { isBarber, isAdmin, loading: roleLoading } = useUserRole();
  const { toast } = useToast();
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [blockedHours, setBlockedHours] = useState<BlockedHour[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showBlockedDatesDialog, setShowBlockedDatesDialog] = useState(false);
  const [showBlockedHoursDialog, setShowBlockedHoursDialog] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null);
  const [deleteAppointment, setDeleteAppointment] = useState<Appointment | null>(null);
  const [selectedBlockedDate, setSelectedBlockedDate] = useState<Date | null>(null);
  const [blockedDateReason, setBlockedDateReason] = useState('');
  const [selectedHourDate, setSelectedHourDate] = useState<Date | null>(null);
  const [selectedBlockedTime, setSelectedBlockedTime] = useState<string>('12:00');
  const [blockedHourReason, setBlockedHourReason] = useState('');

  // Get blocked hours for display
  const blockedHoursForDisplay = blockedHours.map(b => `${b.blocked_date}T${b.blocked_time}`);

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
    fetchPastAppointments();
    fetchServices();
    fetchBarbers();
    fetchBlockedDates();
    fetchBlockedHours();
  };

  const fetchPastAppointments = async () => {
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          barber:barbers(name, avatar_url),
          service:services(name, price, duration_minutes)
        `)
        .lt('appointment_date', today)
        .neq('status', 'cancelled')
        .order('appointment_date', { ascending: false })
        .order('appointment_time', { ascending: false });

      if (error) throw error;

      if (data && data.length > 0) {
        // Get unique user_ids
        const userIds = [...new Set(data.map(a => a.user_id).filter(Boolean))];
        
        // Fetch profiles for these users
        let profilesMap: Record<string, { full_name: string }> = {};
        if (userIds.length > 0) {
          const { data: profiles } = await supabase
            .from('profiles')
            .select('user_id, full_name')
            .in('user_id', userIds);
          
          if (profiles) {
            profiles.forEach(p => {
              profilesMap[p.user_id] = { full_name: p.full_name };
            });
          }
        }

        // Add profile data to appointments
        const appointmentsWithProfiles = data.map(a => ({
          ...a,
          profile: profilesMap[a.user_id] || null
        }));
        
        setPastAppointments(appointmentsWithProfiles as unknown as Appointment[]);
      } else {
        setPastAppointments([]);
      }
    } catch (error) {
      console.error('Error fetching past appointments:', error);
    }
  };

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('*').eq('is_active', true).order('price');
    if (data) setServices(data);
  };

  const fetchBarbers = async () => {
    const { data } = await supabase.from('barbers').select('*').eq('is_active', true);
    if (data) setBarbers(data);
  };

  const fetchBlockedDates = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_dates')
        .select('*')
        .order('blocked_date', { ascending: true });

      if (error) {
        console.error("Detaljna greška za blocked_dates:", error);
        return;
      }
      
      if (data) setBlockedDates(data);
    } catch (err) {
      console.error("Sistemska greška:", err);
    }
  };

  const fetchBlockedHours = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_hours')
        .select('*')
        .order('blocked_date', { ascending: true })
        .order('blocked_time', { ascending: true });

      if (error) {
        console.error("Detaljna greška za blocked_hours:", error);
        return;
      }
      
      if (data) setBlockedHours(data);
    } catch (err) {
      console.error("Sistemska greška:", err);
    }
  };

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const { data, error } = await supabase
        .from('appointments')
        .select(`
          *,
          barber:barbers(name, avatar_url),
          service:services(name, price, duration_minutes)
        `)
        .gte('appointment_date', today)
        .neq('status', 'cancelled')
        .order('appointment_date')
        .order('appointment_time');

      if (error) throw error;

      if (data && data.length > 0) {
        // Get unique user_ids
        const userIds = [...new Set(data.map(a => a.user_id).filter(Boolean))];
        console.log('User IDs from appointments:', userIds);
        
        // Fetch profiles for these users - try without filter first
        let profilesMap: Record<string, { full_name: string }> = {};
        if (userIds.length > 0) {
          // Try fetching all profiles first to see what's available
          const { data: allProfiles, error: allProfilesError } = await supabase
            .from('profiles')
            .select('*');
          
          console.log('All profiles fetched:', allProfiles, 'Error:', allProfilesError);
          
          if (allProfiles && allProfiles.length > 0) {
            // Show available columns
            console.log('Profile columns:', Object.keys(allProfiles[0]));
            
            // Filter client-side for matching user_ids
            // Note: In this database, profiles.id is the user_id
            allProfiles.forEach((p: any) => {
              if (userIds.includes(p.id)) {
                profilesMap[p.id] = { full_name: p.full_name };
              }
            });
          }
        }

        // Add profile data to appointments
        const appointmentsWithProfiles = data.map(a => ({
          ...a,
          profile: profilesMap[a.user_id] || null
        }));
        
        console.log('Appointments with profiles:', appointmentsWithProfiles);
        
        setAppointments(appointmentsWithProfiles as unknown as Appointment[]);
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

  const handleDeleteAppointment = async () => {
    if (!deleteAppointment) return;
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', deleteAppointment.id);
      if (error) throw error;
      toast({ title: 'Termin obrisan', description: 'Termin je uspješno obrisan.' });
      fetchPastAppointments();
    } catch (error) {
      toast({ title: 'Greška', description: 'Nije moguće obrisati termin.', variant: 'destructive' });
    } finally {
      setDeleteAppointment(null);
    }
  };

  const handleBlockDate = async () => {
    if (!selectedBlockedDate || !user) return;
    
    const dateString = format(selectedBlockedDate, 'yyyy-MM-dd');
    
    // Try inserting with just the basic fields
    const { error } = await supabase
      .from('blocked_dates')
      .insert([
        { 
          blocked_date: dateString,
          reason: 'Zatvoreno' 
        }
      ]);

    if (error) {
      console.error("Detalji greške:", error.message);
      toast({ 
        title: "Greška", 
        description: "Provjerite strukturu tablice u bazi.", 
        variant: "destructive" 
      });
    } else {
      toast({ title: "Uspjeh", description: "Datum je blokiran." });
      fetchBlockedDates();
      setSelectedBlockedDate(null);
      setBlockedDateReason('');
    }
  };

  const handleUnblockDate = async (blockedDate: BlockedDate) => {
    try {
      const { error } = await supabase.from('blocked_dates').delete().eq('id', blockedDate.id);
      if (error) throw error;
      toast({ title: 'Datum odblokiran', description: `Datum je uspješno odblokiran za rezervacije.` });
      fetchBlockedDates();
    } catch (error) {
      toast({ title: 'Greška', description: 'Nije moguće odblokirati datum.', variant: 'destructive' });
    }
  };

  const handleBlockHour = async () => {
    if (!selectedHourDate || !user) return;
    
    const dateString = format(selectedHourDate, 'yyyy-MM-dd');
    
    const { error } = await supabase
      .from('blocked_hours')
      .insert([
        { 
          blocked_date: dateString,
          blocked_time: selectedBlockedTime,
          reason: blockedHourReason || 'Zatvoreno'
        }
      ]);

    if (error) {
      console.error("Detalji greške:", error.message);
      toast({ 
        title: "Greška", 
        description: error.message.includes('duplicate') 
          ? "To vrijeme je već blokirano za ovaj datum." 
          : "Nije moguće blokirati vrijeme.", 
        variant: "destructive" 
      });
    } else {
      toast({ title: "Uspjeh", description: "Vrijeme je blokirano." });
      fetchBlockedHours();
      setBlockedHourReason('');
    }
  };

  const handleUnblockHour = async (blockedHour: BlockedHour) => {
    try {
      const { error } = await supabase.from('blocked_hours').delete().eq('id', blockedHour.id);
      if (error) throw error;
      toast({ title: 'Vrijeme odblokirano', description: `Vrijeme je uspješno odblokirano za rezervacije.` });
      fetchBlockedHours();
    } catch (error) {
      toast({ title: 'Greška', description: 'Nije moguće odblokirati vrijeme.', variant: 'destructive' });
    }
  };

  const getDayName = (dayOfWeek: number) => {
    const days = ['Nedjelja', 'Ponedjeljak', 'Utorak', 'Srijeda', 'Četvrtak', 'Petak', 'Subota'];
    return days[dayOfWeek];
  };

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
   if  (hour >= 18) return 'Dobra Večer';
  };

  const blockedDatesStrings = blockedDates.map(b => b.blocked_date);

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
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {[
            { icon: Calendar, label: 'Nadolazeći Termini', value: appointments.length, delay: 0.1 },
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

        {/* Admin: Blocked Dates Section */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }} className="glass-card mb-8">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CalendarOff className="w-5 h-5 text-primary" />
                <h2 className="font-serif text-xl font-bold">Blokirani Datumi</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowBlockedDatesDialog(true)}>
                  <Calendar className="w-4 h-4 mr-1" />
                  Upravljaj Datumima
                </Button>
                <Button variant="ghost" size="sm" onClick={fetchBlockedDates}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              {blockedDates.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nema blokiranih datuma</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {blockedDates.map(blocked => (
                    <Badge key={blocked.id} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 py-2 px-3">
                      {format(new Date(blocked.blocked_date), 'd. MMMM yyyy.', { locale: hr })}
                      <button 
                        onClick={() => handleUnblockDate(blocked)}
                        className="ml-2 hover:text-red-300"
                      >
                        <Ban className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Admin: Blocked Hours Section */}
        {isAdmin && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.36 }} className="glass-card mb-8">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-5 h-5 text-primary" />
                <h2 className="font-serif text-xl font-bold">Blokirani Termini</h2>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setShowBlockedHoursDialog(true)}>
                  <Clock className="w-4 h-4 mr-1" />
                  Upravljaj Terminima
                </Button>
                <Button variant="ghost" size="sm" onClick={fetchBlockedHours}>
                  <RefreshCw className="w-4 h-4" />
                </Button>
              </div>
            </div>
            <div className="p-4">
              {blockedHours.length === 0 ? (
                <p className="text-muted-foreground text-center py-4">Nema blokiranih termina</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {blockedHours.map(blocked => (
                    <Badge key={blocked.id} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 py-2 px-3">
                      {getDayName(blocked.day_of_week)} - {blocked.blocked_time.slice(0, 5)}
                      <button 
                        onClick={() => handleUnblockHour(blocked)}
                        className="ml-2 hover:text-red-300"
                      >
                        <Ban className="w-3 h-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Appointments List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold">Popis Nadolazećih Termina</h2>
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
                <h3 className="font-semibold mb-2">Nema nadolazećih termina</h3>
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
                        <div className="flex flex-col items-center text-primary font-medium min-w-[60px]">
                          <span className="text-xs uppercase">{format(new Date(appointment.appointment_date), 'EEE', { locale: hr })}</span>
                          <span className="text-lg font-bold">{format(new Date(appointment.appointment_date), 'd')}</span>
                          <span className="text-xs">{format(new Date(appointment.appointment_date), 'MMM')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-primary font-medium border-l border-border pl-3">
                          <Clock className="w-4 h-4" />
                          {appointment.appointment_time.slice(0, 5)}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {appointment.notes?.startsWith('Walk-in:')
                              ? appointment.notes.replace('Walk-in: ', '')
                              : (appointment as any).profile?.full_name || 'Klijent'}
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

        {/* Past Appointments */}
        {pastAppointments.length > 0 && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 }} className="glass-card mt-8">
            <div className="p-6 border-b border-border flex items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-muted-foreground" />
                <h2 className="font-serif text-xl font-bold">Prošli Termini</h2>
              </div>
            </div>
            <div className="p-4">
              <div className="space-y-3">
                {pastAppointments.map((appointment, index) => (
                  <motion.div
                    key={appointment.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="appointment-row opacity-70"
                  >
                    <div className="flex items-center justify-between flex-wrap gap-4">
                      <div className="flex items-center gap-4">
                        <div className="flex flex-col items-center text-muted-foreground font-medium min-w-[60px]">
                          <span className="text-xs uppercase">{format(new Date(appointment.appointment_date), 'EEE', { locale: hr })}</span>
                          <span className="text-lg font-bold">{format(new Date(appointment.appointment_date), 'd')}</span>
                          <span className="text-xs">{format(new Date(appointment.appointment_date), 'MMM')}</span>
                        </div>
                        <div className="flex items-center gap-2 text-muted-foreground font-medium border-l border-border pl-3">
                          <Clock className="w-4 h-4" />
                          {appointment.appointment_time.slice(0, 5)}
                        </div>
                        <div>
                          <p className="font-semibold">
                            {appointment.notes?.startsWith('Walk-in:')
                              ? appointment.notes.replace('Walk-in: ', '')
                              : (appointment as any).profile?.full_name || 'Klijent'}
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
                        <span className="font-bold text-muted-foreground">
                          {Number(appointment.service?.price).toFixed(2)} KM
                        </span>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="w-4 h-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              className="text-destructive focus:text-destructive"
                              onClick={() => setDeleteAppointment(appointment)}
                            >
                              <Ban className="w-4 h-4 mr-2" />
                              Obriši
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </div>
          </motion.div>
        )}
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
              <strong>{(cancelAppointment as any)?.profile?.full_name || cancelAppointment?.notes?.startsWith('Walk-in:') ? cancelAppointment?.notes?.replace('Walk-in: ', '') : 'Klijenta'}</strong> u{' '}
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

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteAppointment} onOpenChange={(open) => !open && setDeleteAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Obriši Termin</AlertDialogTitle>
            <AlertDialogDescription>
              Jeste li sigurni da želite obrisati termin za{' '}
              <strong>{(deleteAppointment as any)?.profile?.full_name || deleteAppointment?.notes?.startsWith('Walk-in:') ? deleteAppointment?.notes?.replace('Walk-in: ', '') : 'Klijenta'}</strong> u{' '}
              {deleteAppointment?.appointment_time.slice(0, 5)}? Ova akcija je nepovratna.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ne</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeleteAppointment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Da, Obriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Blocked Dates Management Dialog */}
      <Dialog open={showBlockedDatesDialog} onOpenChange={setShowBlockedDatesDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Upravljanje Blokiranim Datumima</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Odaberi datum za blokiranje</Label>
              <div className="mt-2">
                <DatePicker
                  selected={selectedBlockedDate}
                  onSelect={(date) => setSelectedBlockedDate(date)}
                  blockedDates={blockedDatesStrings}
                />
              </div>
            </div>
            
            {selectedBlockedDate && (
              <div className="space-y-2">
                <Label>Razlog (opcionalno)</Label>
                <Input
                  placeholder="Npr. Praznik, Godišnji odmor..."
                  value={blockedDateReason}
                  onChange={(e) => setBlockedDateReason(e.target.value)}
                />
                <Button
                  variant="gold"
                  className="w-full"
                  onClick={handleBlockDate}
                >
                  Blokiraj Datum
                </Button>
              </div>
            )}

            {blockedDates.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold mb-2">Blokirani datumi:</h4>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {blockedDates.map(blocked => (
                    <Badge key={blocked.id} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 py-1 px-2">
                      {format(new Date(blocked.blocked_date), 'd. MMM yyyy')}
                      <button 
                        onClick={() => handleUnblockDate(blocked)}
                        className="ml-1 hover:text-red-300"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Blocked Hours Management Dialog */}
      <Dialog open={showBlockedHoursDialog} onOpenChange={setShowBlockedHoursDialog}>
        <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-serif">Upravljanje Blokiranim Vremenima</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 mt-4">
            <div>
              <Label>Odaberi datum</Label>
              <div className="mt-2">
                <DatePicker
                  selected={selectedHourDate}
                  onSelect={(date) => setSelectedHourDate(date)}
                  blockedDates={blockedHoursForDisplay}
                />
              </div>
            </div>

            <div>
              <Label>Vrijeme</Label>
              <div className="grid grid-cols-3 gap-2 mt-2">
                {['08:00', '08:30', '09:00', '09:30', '10:00', '10:30', '11:00', '11:30', '12:00', '12:30', '13:00', '13:30', '14:00', '14:30', '15:00', '15:30', '16:00', '16:30', '17:00', '17:30', '18:00', '18:30'].map(time => (
                <Button
                  key={time}
                  variant={selectedBlockedTime === time ? "gold" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBlockedTime(time)}
                >
                  {time}
                </Button>
              ))}
              </div>
            </div>

            <Button
              variant="gold"
              className="w-full"
              onClick={handleBlockHour}
              disabled={!selectedHourDate}
            >
              Blokiraj Vrijeme
            </Button>

            {blockedHours.length > 0 && (
              <div className="pt-4 border-t border-border">
                <h4 className="font-semibold mb-2">Blokirana vremena:</h4>
                <div className="flex flex-wrap gap-2 max-h-32 overflow-y-auto">
                  {blockedHours.map(blocked => (
                    <Badge key={blocked.id} variant="outline" className="bg-red-500/10 text-red-400 border-red-500/30 py-1 px-2">
                      {format(new Date(blocked.blocked_date), 'd. MMM')}, {blocked.blocked_time ? blocked.blocked_time.slice(0, 5) : ''}
                      <button 
                        onClick={() => handleUnblockHour(blocked)}
                        className="ml-1 hover:text-red-300"
                      >
                        ×
                      </button>
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

