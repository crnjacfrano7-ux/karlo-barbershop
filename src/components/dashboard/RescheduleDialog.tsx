import { useState, useEffect } from 'react';
import { format, isSaturday } from 'date-fns';
import { hr } from 'date-fns/locale';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Appointment, Service, Barber } from '@/types/database';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { DatePicker } from '@/components/DatePicker';
import { TimeSlotPicker } from '@/components/TimeSlotPicker';
import { Label } from '@/components/ui/label';

interface RescheduleDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointment: Appointment | null;
  barbers: Barber[];
  onSuccess: () => void;
}

export function RescheduleDialog({ open, onOpenChange, appointment, barbers, onSuccess }: RescheduleDialogProps) {
  const { toast } = useToast();
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [selectedTime, setSelectedTime] = useState<string | null>(null);
  const [selectedBarber, setSelectedBarber] = useState<string>('');
  const [bookedSlots, setBookedSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (appointment) {
      setSelectedBarber(appointment.barber_id);
      setSelectedDate(null);
      setSelectedTime(null);
    }
  }, [appointment]);

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
      .neq('status', 'cancelled')
      .neq('id', appointment?.id || '');
    setBookedSlots(data?.map(a => a.appointment_time) || []);
  };

  const handleReschedule = async () => {
    if (!appointment || !selectedDate || !selectedTime) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from('appointments')
        .update({
          appointment_date: format(selectedDate, 'yyyy-MM-dd'),
          appointment_time: selectedTime,
          barber_id: selectedBarber,
        })
        .eq('id', appointment.id);
      if (error) throw error;
      toast({ title: 'Termin premješten', description: 'Termin je uspješno premješten.' });
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error(error);
      toast({ title: 'Greška', description: 'Nije moguće premjestiti termin.', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-serif">Premjesti Termin</DialogTitle>
        </DialogHeader>
        {appointment && (
          <div className="space-y-4 mt-4">
            <p className="text-sm text-muted-foreground">
              Premještanje termina za <strong>{appointment.profile?.full_name || 'Gost'}</strong> — {appointment.service?.name}
            </p>
            <div>
              <Label>Frizer</Label>
              <Select value={selectedBarber} onValueChange={setSelectedBarber}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {barbers.map(b => (
                    <SelectItem key={b.id} value={b.id}>{b.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Novi Datum</Label>
              <DatePicker
                selected={selectedDate}
                onSelect={(date) => { setSelectedDate(date); setSelectedTime(null); }}
              />
            </div>
            {selectedDate && (
              <div>
                <Label>Novo Vrijeme</Label>
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
              onClick={handleReschedule}
              disabled={loading || !selectedDate || !selectedTime}
            >
              {loading ? 'Premještanje...' : 'Premjesti Termin'}
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
