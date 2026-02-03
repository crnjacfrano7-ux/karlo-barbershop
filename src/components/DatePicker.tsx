import { useState } from 'react';
import { motion } from 'framer-motion';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { format, addMonths, subMonths, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, isToday, isBefore, startOfToday } from 'date-fns';
import { cn } from '@/lib/utils';
import { Button } from './ui/button';

interface DatePickerProps {
  selected: Date | null;
  onSelect: (date: Date) => void;
}

export function DatePicker({ selected, onSelect }: DatePickerProps) {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const today = startOfToday();

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const startDay = startOfMonth(currentMonth).getDay();
  const paddingDays = Array.from({ length: startDay }, (_, i) => i);

  const weekDays = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

  return (
    <div className="glass-card p-6">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
        >
          <ChevronLeft className="w-5 h-5" />
        </Button>
        <h3 className="font-serif text-xl font-semibold">
          {format(currentMonth, 'MMMM yyyy')}
        </h3>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
        >
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>

      <div className="grid grid-cols-7 gap-1 mb-2">
        {weekDays.map(day => (
          <div
            key={day}
            className="text-center text-sm font-medium text-muted-foreground py-2"
          >
            {day}
          </div>
        ))}
      </div>

      <div className="grid grid-cols-7 gap-1">
        {paddingDays.map(i => (
          <div key={`padding-${i}`} className="p-2" />
        ))}
        {days.map(day => {
          const isSelected = selected && isSameDay(day, selected);
          const isPast = isBefore(day, today);
          const isCurrentMonth = isSameMonth(day, currentMonth);
          const isDayToday = isToday(day);

          return (
            <motion.button
              key={day.toISOString()}
              whileHover={{ scale: isPast ? 1 : 1.1 }}
              whileTap={{ scale: isPast ? 1 : 0.95 }}
              onClick={() => !isPast && onSelect(day)}
              disabled={isPast}
              className={cn(
                'p-2 rounded-lg text-center transition-all duration-200',
                'hover:bg-secondary',
                isPast && 'opacity-30 cursor-not-allowed',
                !isCurrentMonth && 'text-muted-foreground',
                isDayToday && !isSelected && 'border border-primary/50',
                isSelected && 'bg-primary text-primary-foreground shadow-gold'
              )}
            >
              {format(day, 'd')}
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
