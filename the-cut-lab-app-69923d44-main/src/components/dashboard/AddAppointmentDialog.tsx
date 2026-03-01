import { useState } from 'react';
import { format, isSaturday } from 'date-fns';
import { hr } from 'date-fns/locale';
import { Plus, X } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Service, Barber } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { useEffect } from 'react';

interface AddAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  services: Service[];
  barbers: Barber[];
  onSuccess: () => void;
  isAdmin?: boolean;
  blackoutDates?: Date[];
}

export function AddAppointmentDialog({
  open,
  onOpenChange,
  services,
  barbers,
  onSuccess,
  isAdmin = false,
  blackoutDates = [],
}: AddAppointmentDialogProps) {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [currentUserName, setCurrentUserName] = useState<string>('Klijent');

  useEffect(() => {
    if (open) {
      fetchCurrentUserName();
    }
  }, [open]);

  const fetchCurrentUserName = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data } = await supabase
          .from('profiles')
          .select('full_name')
          .eq('user_id', user.id)
          .single();
        if (data?.full_name) {
          setCurrentUserName(data.full_name);
        }
      }
    } catch (error) {
      setCurrentUserName('Klijent');
    }
  };

  // Removed customer list fetching - admins can no longer create reservations for other accounts

  useEffect(() => {
    if (selectedBarber && selectedDate) {
      fetchBookedSlots();
    }
  }, [selectedBarber, selectedDate]);

  const fetchBookedSlots = async () => {
    if (!selectedBarber || !selectedDate) return;
    const { data } = await supabase
      .from('appointments')
      .select('appointment_time')
      .eq('barber_id', selectedBarber)
      .eq('appointment_date', format(selectedDate, 'yyyy-MM-dd'))
      .neq('status', 'cancelled');
    setBookedSlots(data?.map(a => a.appointment_time) || []);
  };

  const handleSubmit = async () => {
    if (!selectedService || !selectedBarber || !selectedDate || !selectedTime) return;
    setLoading(true);
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      // Extract the IDs specifically to avoid sending [object Object]
      const serviceId = typeof selectedService === 'object' ? (selectedService as any).id : selectedService;
      const barberId = typeof selectedBarber === 'object' ? (selectedBarber as any).id : selectedBarber;

      // Validate IDs are strings
      if (!serviceId || typeof serviceId !== 'string') {
        throw new Error('Invalid service selected');
      }
      if (!barberId || typeof barberId !== 'string') {
        throw new Error('Invalid barber selected');
      }

      // Determine customer name (optional walk-in name)
      let nameToUse = customerName || 'Klijent';

      console.log('Submitting appointment with:', {
        user_id: user.id,
        service_id: serviceId,
        barber_id: barberId,
        customer_name: nameToUse,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
      });

      const { error } = await supabase.from('appointments').insert({
        user_id: user.id,
        service_id: serviceId,
        barber_id: barberId,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        status: 'confirmed',
        customer_name: nameToUse,
        notes: null,
      });

      if (error) throw error;
      toast({ title: 'Termin dodan', description: 'Novi termin je uspješno kreiran.' });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Nije moguće dodati termin.';
      console.error('Error submitting appointment:', errorMsg);
      toast({ title: 'Greška', description: errorMsg, variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setSelectedService('');
    setSelectedBarber('');
    setSelectedDate(null);
    setSelectedTime(null);
    setCustomerName('');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Dodaj Novi Termin</DialogTitle>
        </DialogHeader>
        <div className="space-y-4 mt-4">
          <div>
            <p className="text-sm">Kreiraj termin kao: <strong>{currentUserName}</strong></p>
          </div>
          <div>
            <Label id="customer-name-label" htmlFor="customer-name">Ime Klijenta (opcionalno - koristi za prosljeđivanje)</Label>
            <Input
              id="customer-name"
              placeholder={currentUserName}
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
              disabled={false}
            />
            <p className="text-xs text-muted-foreground mt-1">Ostavite prazno za korištenje imena iz vašeg računa</p>
          </div>
          <div>
            <Label id="service-label" htmlFor="service-select">Usluga</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger id="service-select" aria-labelledby="service-label"><SelectValue placeholder="Odaberi uslugu" /></SelectTrigger>
              <SelectContent>
                {services
                  .filter(s => s.id && s.id !== '')
                  .map(s => (
                    <SelectItem key={s.id} value={String(s.id)}>
                      {s.name} - {s.price} KM
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label id="barber-label" htmlFor="barber-select">Frizer</Label>
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
              <SelectTrigger id="barber-select" aria-labelledby="barber-label"><SelectValue placeholder="Odaberi frizera" /></SelectTrigger>
              <SelectContent>
                {barbers
                  .filter(b => b.id && b.id !== '')
                  .map(b => (
                    <SelectItem key={b.id} value={String(b.id)}>
                      {b.name}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label id="date-label" htmlFor="date-picker">Datum</Label>
            <div id="date-picker" aria-labelledby="date-label">
              <DatePicker
                selected={selectedDate}
                onSelect={(date) => { setSelectedDate(date); setSelectedTime(null); }}
                disabledDates={blackoutDates}
                highlightedDates={blackoutDates}
              />
            </div>
          </div>
          {selectedDate && (
            <div>
              <Label id="time-label" htmlFor="time-picker">Vrijeme</Label>
              <div id="time-picker" aria-labelledby="time-label">
                <TimeSlotPicker
                  selectedTime={selectedTime}
                  onSelect={setSelectedTime}
                  bookedSlots={bookedSlots}
                  isSaturday={isSaturday(selectedDate)}
                />
              </div>
            </div>
          )}
          <Button
            variant="gold"
            className="w-full"
            onClick={handleSubmit}
            disabled={loading || !selectedService || !selectedBarber || !selectedDate || !selectedTime}
          >
            {loading ? 'Dodavanje...' : 'Dodaj Termin'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
