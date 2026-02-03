import { motion } from 'framer-motion';
import { Barber } from '@/types/database';
import { cn } from '@/lib/utils';

interface BarberCardProps {
  barber: Barber;
  selected: boolean;
  onSelect: () => void;
}

export function BarberCard({ barber, selected, onSelect }: BarberCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onSelect}
      className={cn(
        'barber-card relative overflow-hidden',
        selected && 'selected'
      )}
    >
      <div className="relative mb-4">
        <div className={cn(
          'w-24 h-24 mx-auto rounded-full overflow-hidden border-2 transition-colors',
          selected ? 'border-primary' : 'border-border'
        )}>
          <img
            src={barber.avatar_url || '/placeholder.svg'}
            alt={barber.name}
            className="w-full h-full object-cover"
          />
        </div>
        {selected && (
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="absolute -bottom-1 left-1/2 -translate-x-1/2"
          >
            <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
              <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
          </motion.div>
        )}
      </div>
      
      <h3 className="font-serif font-semibold text-lg mb-1">{barber.name}</h3>
      
      {barber.specialties && barber.specialties.length > 0 && (
        <div className="flex flex-wrap justify-center gap-1 mt-2">
          {barber.specialties.slice(0, 2).map((specialty, index) => (
            <span
              key={index}
              className="text-xs px-2 py-1 rounded-full bg-muted text-muted-foreground"
            >
              {specialty}
            </span>
          ))}
        </div>
      )}
    </motion.div>
  );
}
