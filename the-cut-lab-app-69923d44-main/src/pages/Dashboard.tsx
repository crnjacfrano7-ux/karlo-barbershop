import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { format, parseISO, addMinutes, isAfter, startOfToday } from 'date-fns';
import { hr } from 'date-fns/locale';
import {
  Scissors, Calendar, DollarSign, Users, Clock, ChevronLeft,
  RefreshCw, Plus, Ban, ArrowRightLeft, MoreHorizontal, AlertCircle, X, Trash2,
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useUserRole } from '@/hooks/useUserRole';
import { useToast } from '@/hooks/use-toast';
import { Appointment, Service, Barber, BlackoutDate } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { DatePicker } from '@/components/DatePicker';
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
  const [filterBarber, setFilterBarber] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [rescheduleAppointment, setRescheduleAppointment] = useState<Appointment | null>(null);
  const [cancelAppointment, setCancelAppointment] = useState<Appointment | null>(null);
  const [deleteAppointment, setDeleteAppointment] = useState<Appointment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [blackoutDates, setBlackoutDates] = useState<BlackoutDate[]>([]);
  const [pendingBlackoutDates, setPendingBlackoutDates] = useState<Date[]>([]);
  const [blackoutReason, setBlackoutReason] = useState('');
  const [savingBlackout, setSavingBlackout] = useState(false);

  useEffect(() => {
    if (authLoading || roleLoading) {
      return;
    }
    
    if (!user) { 
      navigate('/login'); 
      return; 
    }
    
    if (!isBarber && !isAdmin) { 
      navigate('/'); 
      return; 
    }
    
    fetchAll();
    
    const cleanup = setupRealtimeSubscription();
    return cleanup;
  }, [user, isBarber, isAdmin, authLoading, roleLoading, navigate]);

  const fetchAll = () => {
    fetchAppointments();
    fetchServices();
    fetchBarbers();
    fetchBlackoutDates();
  };

  const fetchServices = async () => {
    try {
      const { data, error } = await supabase.from('services').select('*').eq('is_active', true).order('price');
      if (error) throw new Error(`Services Error: ${error.message}`);
      if (data) setServices(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching services:', error);
      const errorMsg = error instanceof Error ? error.message : 'Nije moguće učitati usluge.';
      setError(errorMsg);
      toast({ title: 'Greška pri učitavanju usluga', description: errorMsg, variant: 'destructive' });
    }
  };

  const fetchBarbers = async () => {
    try {
      const { data, error } = await supabase.from('barbers').select('*').eq('is_active', true);
      if (error) throw new Error(`Barbers Error: ${error.message}`);
      if (data) setBarbers(data);
      setError(null);
    } catch (error) {
      console.error('Error fetching barbers:', error);
      const errorMsg = error instanceof Error ? error.message : 'Nije moguće učitati frizere.';
      setError(errorMsg);
      toast({ title: 'Greška pri učitavanju frizera', description: errorMsg, variant: 'destructive' });
    }
  };

  const fetchBlackoutDates = async () => {
    try {
      const { data, error } = await supabase
        .from('blackout_dates')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw new Error(`Blackout Dates Error: ${error.message}`);
      setBlackoutDates((data as unknown as BlackoutDate[]) || []);
    } catch (error) {
      console.error('Error fetching blackout dates:', error);
      // Non-blocking: dashboard still works without this feature
    }
  };

  const fetchAppointments = async (barberId?: string | null) => {
    setLoading(true);
    setError(null);
    try {
      let q: any = supabase
        .from('appointments')
        .select(`*, barber:barbers(name, avatar_url), service:services(name, price, duration_minutes)`)
        .neq('status', 'cancelled');
      const barberToFilter = barberId !== undefined ? barberId : filterBarber;
      if (barberToFilter) {
        q = q.eq('barber_id', barberToFilter);
      }
      q = q.order('appointment_date', { ascending: true }).order('appointment_time', { ascending: true });
      const { data, error } = await q;

      if (error) {
        throw new Error(`Supabase Error: ${error.message} (Code: ${error.code})`);
      }
      if (data && data.length > 0) {
        const userIds = Array.from(new Set(data.map(a => a.user_id).filter(Boolean)));
        let profiles: any[] | null = null;
        if (userIds.length > 0) {
          const res = await supabase
            .from('profiles')
            .select('user_id, full_name, phone')
            .in('user_id', userIds);
          if (!res.error) {
            profiles = res.data || null;
          }
        }

        const appointmentsWithProfiles = data.map(apt => {
          const profile = profiles?.find((p: any) => p.user_id === apt.user_id) || undefined;
          const displayName = apt.customer_name || profile?.full_name || null;
          return ({
            ...apt,
            profile,
            display_name: displayName,
          });
        }) as unknown as Appointment[];
        setAppointments(appointmentsWithProfiles);
      } else {
        setAppointments([]);
      }
      setError(null);
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Nije moguće učitati termine.';
      setError(errorMsg);
      toast({ title: 'Greška', description: errorMsg, variant: 'destructive' });
      setAppointments([]);
    } finally {
      setLoading(false);
    }
  };

  const setupRealtimeSubscription = () => {
    try {
      const channel = supabase
        .channel('appointments-changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'appointments' }, () => {
          fetchAppointments();
        })
        .subscribe();
      return () => { 
        try {
          supabase.removeChannel(channel);
        } catch (e) {
          // Silently ignore cleanup errors
        }
      };
    } catch (error) {
      // Return a no-op cleanup function - dashboard will still work without realtime
      return () => {};
    }
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

  const handleDelete = async () => {
    if (!deleteAppointment) return;
    try {
      const { error } = await supabase
        .from('appointments')
        .delete()
        .eq('id', deleteAppointment.id);
      if (error) throw error;
      toast({
        title: 'Termin izbrisan',
        description: 'Termin je trajno uklonjen iz evidencije.',
      });
      fetchAppointments();
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće izbrisati termin.',
        variant: 'destructive',
      });
    } finally {
      setDeleteAppointment(null);
    }
  };

  const totalRevenue = appointments.reduce((sum, apt) => sum + (Number(apt.service?.price) || 0), 0);

  const blackoutDateObjects = blackoutDates
    .filter(b => b.date)
    .map(b => parseISO(b.date));

  const upcomingBlackoutDates = blackoutDates.filter(b => {
    try {
      const d = parseISO(b.date);
      const today = startOfToday();
      return isAfter(d, today) || d.toDateString() === today.toDateString();
    } catch {
      return false;
    }
  });

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

  const getAppointmentName = (appointment: Appointment) => {
    // Priority: computed display_name (set on fetch) -> customer_name -> profile.full_name -> email local-part -> 'Gost'
    if (appointment.display_name) return appointment.display_name;
    if (appointment.customer_name) return appointment.customer_name;
    const profileName = appointment.profile?.full_name;
    if (profileName) return profileName;
    // try fallback to email local-part if available
    const email = (appointment as any).profile?.email || (appointment as any).email;
    if (email && typeof email === 'string' && email.includes('@')) return email.split('@')[0];
    return 'Gost';
  };

  const handleTogglePendingBlackoutDate = (date: Date) => {
    setPendingBlackoutDates(prev => {
      const exists = prev.some(d => d.toDateString() === date.toDateString());
      if (exists) {
        return prev.filter(d => d.toDateString() !== date.toDateString());
      }
      return [...prev, date];
    });
  };

  const handleAddBlackoutDate = async () => {
    if (pendingBlackoutDates.length === 0) return;
    try {
      setSavingBlackout(true);
      const existingDates = new Set(blackoutDates.map(b => b.date));

      const payload = pendingBlackoutDates
        .map(date => {
          const dateStr = format(date, 'yyyy-MM-dd');
          if (existingDates.has(dateStr)) {
            return null;
          }
          return {
            date: dateStr,
            reason: blackoutReason || null,
            created_by: user?.id || null,
          };
        })
        .filter(
          (row): row is { date: string; reason: string | null; created_by: string | null } =>
            row !== null
        );

      if (payload.length === 0) {
        toast({
          title: 'Svi datumi su već zatvoreni',
          description: 'Odabrani datumi su već na popisu zatvorenih dana.',
          variant: 'destructive',
        });
        return;
      }

      const { error } = await supabase.from('blackout_dates').insert(payload);
      if (error) throw error;

      toast({
        title: 'Dani zatvoreni',
        description: 'Odabrani datumi su označeni kao zatvoreni za rezervacije.',
      });
      setPendingBlackoutDates([]);
      setBlackoutReason('');
      fetchBlackoutDates();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Nije moguće spremiti zatvoreni dan.';
      toast({
        title: 'Greška',
        description: message,
        variant: 'destructive',
      });
    } finally {
      setSavingBlackout(false);
    }
  };

  const handleRemoveBlackoutDate = async (id: string) => {
    try {
      const { error } = await supabase.from('blackout_dates').delete().eq('id', id);
      if (error) throw error;
      toast({
        title: 'Dan ponovno otvoren',
        description: 'Dan je uklonjen s popisa zatvorenih dana.',
      });
      fetchBlackoutDates();
    } catch (error) {
      toast({
        title: 'Greška',
        description: 'Nije moguće ukloniti zatvoreni dan.',
        variant: 'destructive',
      });
    }
  };

  const isUpcomingAppointment = (appointment: Appointment): boolean => {
    if (!appointment.appointment_date || !appointment.appointment_time) return false;
    try {
      const start = parseISO(`${appointment.appointment_date}T${appointment.appointment_time}`);
      const now = new Date();
      // Consider appointment upcoming if it's not more than 30 minutes past its start
      return now < addMinutes(start, 30);
    } catch {
      return false;
    }
  };

  const upcomingAppointments = appointments.filter(a => 
    isUpcomingAppointment(a) && a.status !== 'cancelled'
  );

  const passedAppointments = appointments.filter(a => 
    !isUpcomingAppointment(a) || a.status === 'cancelled'
  );

  if (authLoading || roleLoading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary" />
          <p className="text-muted-foreground text-sm">Provjera pristupa...</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Niste prijavljeni</h2>
          <p className="text-muted-foreground mb-4">Molimo prvo se prijavite.</p>
          <Button onClick={() => navigate('/login')}>Prijava</Button>
        </div>
      </div>
    );
  }

  if (!isBarber && !isAdmin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold mb-2">Pristup Odbijen</h2>
          <p className="text-muted-foreground mb-4">Nemate pristup nadzornoj ploči. Samo frizeri i administratori mogu pristupiti ovoj stranici.</p>
          <p className="text-sm text-muted-foreground mb-4">Email: {user.email}</p>
          <Button onClick={() => navigate('/')}>Povratak na početnu</Button>
        </div>
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
        {/* Error Alert */}
        {error && (
          <div className="mb-6">
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Greška</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          </div>
        )}

        {/* Welcome */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
          <h1 className="text-3xl font-serif font-bold">{getGreeting()}</h1>
          <p className="text-muted-foreground">Evo pregleda svih termina</p>
        </motion.div>

        {/* Stats */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {[
            { icon: Calendar, label: 'Ukupno Termina', value: appointments.length, delay: 0.1 },
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

        {/* Blackout dates management */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card mb-8"
        >
          <div className="p-6 border-b border-border flex items-center justify-between">
            <div>
              <h2 className="font-serif text-xl font-bold">Zatvoreni Dani</h2>
              <p className="text-sm text-muted-foreground">
                Odaberi datume kada salon ne prima rezervacije. Ovi dani neće biti dostupni u kalendaru.
              </p>
            </div>
          </div>
          <div className="p-6 grid gap-6 lg:grid-cols-2">
            <div className="space-y-4">
              <h3 className="font-semibold">Dodaj Zatvoreni Dan</h3>
              <DatePicker
                selected={null}
                onSelect={handleTogglePendingBlackoutDate}
                highlightedDates={[...blackoutDateObjects, ...pendingBlackoutDates]}
              />
              <div className="space-y-2">
                <Label htmlFor="blackout-reason">Razlog (opcionalno)</Label>
                <Input
                  id="blackout-reason"
                  placeholder="Npr. godišnji odmor, inventura..."
                  value={blackoutReason}
                  onChange={(e) => setBlackoutReason(e.target.value)}
                />
              </div>
              <Button
                variant="gold"
                className="w-full"
                onClick={handleAddBlackoutDate}
                disabled={savingBlackout || pendingBlackoutDates.length === 0}
              >
                {savingBlackout ? 'Spremanje...' : 'Spremi Zatvorene Dane'}
              </Button>
            </div>
            <div className="space-y-4">
              <h3 className="font-semibold">Nadolazeći Zatvoreni Dani</h3>
              {upcomingBlackoutDates.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  Trenutno nema dodanih zatvorenih dana.
                </p>
              ) : (
                <div className="space-y-2">
                  {upcomingBlackoutDates.map((b) => {
                    let label = b.date;
                    try {
                      label = format(parseISO(b.date), 'EEEE, d. MMMM yyyy.', { locale: hr });
                    } catch {
                      // fallback to raw date string
                    }
                    return (
                      <div
                        key={b.id}
                        className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 bg-card/60"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium">{label}</span>
                          {b.reason && (
                            <span className="text-xs text-muted-foreground">
                              {b.reason}
                            </span>
                          )}
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-muted-foreground hover:text-destructive"
                          onClick={() => handleRemoveBlackoutDate(b.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </motion.div>

        {/* Appointments List */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }} className="glass-card">
          <div className="p-6 border-b border-border flex items-center justify-between">
            <h2 className="font-serif text-xl font-bold">Popis Termina</h2>
            <div className="flex items-center gap-2">
                <div className="flex items-center gap-2">
                  <Select value={filterBarber || ''} onValueChange={(v) => { setFilterBarber(v || null); fetchAppointments(v || null); }}>
                    <SelectTrigger className="w-44"><SelectValue placeholder="Svi Frizeri" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">Svi Frizeri</SelectItem>
                      {barbers.map(b => (
                        <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                {isAdmin && (
                  <Button variant="gold" size="sm" onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Dodaj Termin
                  </Button>
                )}
              <Button variant="ghost" size="sm" onClick={fetchAppointments}>
                <RefreshCw className={`w-4 h-4 mr-1 ${loading ? 'animate-spin' : ''}`} />
                Osvježi
              </Button>
            </div>
          </div>

          <div className="p-4">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-primary mb-4" />
                <p className="text-muted-foreground text-sm">Učitavanje termina...</p>
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12">
                <Calendar className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
                <h3 className="font-semibold mb-2">Nema termina</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Trenutno nema zakazanih termina. {isAdmin && 'Dodajte novi termin.'}
                </p>
                {isAdmin && (
                  <Button variant="outline" onClick={() => setShowAddDialog(true)}>
                    <Plus className="w-4 h-4 mr-1" />
                    Dodaj Termin
                  </Button>
                )}
              </div>
            ) : (
              <div className="space-y-8">
                {/* Upcoming Appointments Section */}
                <div>
                  <h3 className="font-serif text-lg font-semibold mb-4 text-primary flex items-center gap-2">
                    <Calendar className="w-5 h-5" />
                    Predstojećih Termina ({upcomingAppointments.length})
                  </h3>
                  {upcomingAppointments.length === 0 ? (
                    <p className="text-muted-foreground text-sm text-center py-8">Nema predstojećih termina</p>
                  ) : (
                    <div className="space-y-3">
                      {upcomingAppointments.map((appointment, index) => (
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
                                <div className="flex flex-col">
                                  <span>{appointment.appointment_time?.slice(0, 5)}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {appointment.appointment_date
                                      ? format(parseISO(appointment.appointment_date), 'EEEE, d. MMM yyyy', { locale: hr })
                                      : ''}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="font-semibold">{getAppointmentName(appointment)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {appointment.service?.name} • {appointment.barber?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">Rezervirao: {getAppointmentName(appointment)}{appointment.profile?.phone ? ` • ${appointment.profile.phone}` : ''}</p>
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

                {/* Passed Appointments Section */}
                {passedAppointments.length > 0 && (
                  <div>
                    <h3 className="font-serif text-lg font-semibold mb-4 text-muted-foreground flex items-center gap-2">
                      <Calendar className="w-5 h-5" />
                      Prošli Termini ({passedAppointments.length})
                    </h3>
                    <div className="space-y-3 opacity-75">
                      {passedAppointments.map((appointment, index) => (
                        <motion.div
                          key={appointment.id}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: index * 0.05 }}
                          className="appointment-row"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-4">
                            <div className="flex items-center gap-4">
                              <div className="flex items-center gap-2 text-muted-foreground font-medium">
                                <Clock className="w-4 h-4" />
                                <div className="flex flex-col">
                                  <span>{appointment.appointment_time?.slice(0, 5)}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {appointment.appointment_date
                                      ? format(parseISO(appointment.appointment_date), 'EEEE, d. MMM yyyy', { locale: hr })
                                      : ''}
                                  </span>
                                </div>
                              </div>
                              <div>
                                <p className="font-semibold">{getAppointmentName(appointment)}</p>
                                <p className="text-sm text-muted-foreground">
                                  {appointment.service?.name} • {appointment.barber?.name}
                                </p>
                                <p className="text-xs text-muted-foreground">Rezervirao: {getAppointmentName(appointment)}{appointment.profile?.phone ? ` • ${appointment.profile.phone}` : ''}</p>
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
                                    <Trash2 className="w-4 h-4 mr-2" />
                                    Izbriši
                                  </DropdownMenuItem>
                                </DropdownMenuContent>
                              </DropdownMenu>
                            </div>
                          </div>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                )}
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
        isAdmin={isAdmin}
        blackoutDates={blackoutDateObjects}
      />

      {/* Reschedule Dialog */}
      <RescheduleDialog
        open={!!rescheduleAppointment}
        onOpenChange={(open) => !open && setRescheduleAppointment(null)}
        appointment={rescheduleAppointment}
        barbers={barbers}
        onSuccess={fetchAppointments}
        blackoutDates={blackoutDateObjects}
      />

      {/* Cancel Confirmation */}
      <AlertDialog open={!!cancelAppointment} onOpenChange={(open) => !open && setCancelAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Otkaži Termin</AlertDialogTitle>
            <AlertDialogDescription>
              Jeste li sigurni da želite otkazati termin za{' '}
              <strong>{cancelAppointment ? getAppointmentName(cancelAppointment) : 'Gost'}</strong> u{' '}
              {cancelAppointment?.appointment_time?.slice(0, 5)}?
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

      {/* Delete Confirmation (past appointments) */}
      <AlertDialog open={!!deleteAppointment} onOpenChange={(open) => !open && setDeleteAppointment(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Izbriši Termin</AlertDialogTitle>
            <AlertDialogDescription>
              Ovaj termin će biti trajno izbrisan. Jeste li sigurni da želite izbrisati termin za{' '}
              <strong>{deleteAppointment ? getAppointmentName(deleteAppointment) : 'Gost'}</strong>{' '}
              u {deleteAppointment?.appointment_time?.slice(0, 5)}?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Ne</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Da, Izbriši
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
