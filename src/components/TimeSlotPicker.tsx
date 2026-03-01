import { motion } from 'framer-motion';
import { Clock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimeSlotPickerProps {
  selectedTime: string | null;
  onSelect: (time: string) => void;
  bookedSlots?: string[];
  isSaturday?: boolean;
}

// Generate time slots based on day
const generateTimeSlots = (isSaturday: boolean) => {
  const slots: string[] = [];
  const startHour = isSaturday ? 8 : 8;
  const startMinute = isSaturday ? 0 : 30;
  const endHour = isSaturday ? 14 : 18;
  
  let hour = startHour;
  let minute = startMinute;
  
  while (hour < endHour || (hour === endHour && minute === 0)) {
    slots.push(`${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`);
    minute += 30;
    if (minute >= 60) {
      minute = 0;
      hour += 1;
    }
  }
  
  return slots;
};

const formatTime = (time: string) => {
  const [hours, minutes] = time.split(':');
  return `${hours}:${minutes}`;
};

export function TimeSlotPicker({ selectedTime, onSelect, bookedSlots = [], isSaturday = false }: TimeSlotPickerProps) {
  const timeSlots = generateTimeSlots(isSaturday);

  return (
    <div className="glass-card p-6">
      <div className="flex items-center gap-2 mb-6">
        <Clock className="w-5 h-5 text-primary" />
        <h3 className="font-serif text-xl font-semibold">Odaberi Vrijeme</h3>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
        {timeSlots.map(time => {
          const isBooked = bookedSlots.includes(time);
          const isSelected = selectedTime === time;

          return (
            <motion.button
              key={time}
              whileHover={{ scale: isBooked ? 1 : 1.05 }}
              whileTap={{ scale: isBooked ? 1 : 0.95 }}
              onClick={() => !isBooked && onSelect(time)}
              disabled={isBooked}
              className={cn(
                'time-slot',
                isSelected && 'selected',
                isBooked && 'opacity-40 cursor-not-allowed line-through'
              )}
            >
              {formatTime(time)}
            </motion.button>
          );
        })}
      </div>

      <p className="text-sm text-muted-foreground mt-4 text-center">
        Sva vremena su u vašoj vremenskoj zoni
      </p>
    </div>
  );
}
