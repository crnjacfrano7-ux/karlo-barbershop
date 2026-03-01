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
}

export function AddAppointmentDialog({ open, onOpenChange, services, barbers, onSuccess }: AddAppointmentDialogProps) {
  const { toast } = useToast();
  const [selectedService, setSelectedService] = useState<string>('');
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [customerName, setCustomerName] = useState('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

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
      // Create a walk-in appointment using the barber's own user_id
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Not authenticated');

      const { error } = await supabase.from('appointments').insert({
        user_id: user.id,
        service_id: selectedService,
        barber_id: selectedBarber,
        appointment_date: format(selectedDate, 'yyyy-MM-dd'),
        appointment_time: selectedTime,
        status: 'confirmed',
        notes: customerName ? `Walk-in: ${customerName}` : 'Walk-in termin',
      });
      if (error) throw error;
      toast({ title: 'Termin dodan', description: 'Novi termin je uspješno kreiran.' });
      onSuccess();
      onOpenChange(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast({ title: 'Greška', description: 'Nije moguće dodati termin.', variant: 'destructive' });
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
            <Label>Ime Klijenta (opcionalno)</Label>
            <Input
              placeholder="Walk-in klijent"
              value={customerName}
              onChange={e => setCustomerName(e.target.value)}
            />
          </div>
          <div>
            <Label>Usluga</Label>
            <Select value={selectedService} onValueChange={setSelectedService}>
              <SelectTrigger><SelectValue placeholder="Odaberi uslugu" /></SelectTrigger>
              <SelectContent>
                {services.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name} - {s.price} KM</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Frizer</Label>
            <Select value={selectedBarber} onValueChange={setSelectedBarber}>
              <SelectTrigger><SelectValue placeholder="Odaberi frizera" /></SelectTrigger>
              <SelectContent>
                {barbers.map(b => (
                  <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Datum</Label>
            <DatePicker
              selected={selectedDate}
              onSelect={(date) => { setSelectedDate(date); setSelectedTime(null); }}
            />
          </div>
          {selectedDate && (
            <div>
              <Label>Vrijeme</Label>
              <TimeSlotPicker
                selectedTime={selectedTime}
                onSelect={setSelectedTime}
                bookedSlots={bookedSlots}
                isSaturday={isSaturday(selectedDate)}
              />
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
