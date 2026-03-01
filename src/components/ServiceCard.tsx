import { motion } from 'framer-motion';
import { Scissors, Clock } from 'lucide-react';
import { Service } from '@/types/database';
import { cn } from '@/lib/utils';

interface ServiceCardProps {
  service: Service;
  selected: boolean;
  onSelect: () => void;
}

export function ServiceCard({ service, selected, onSelect }: ServiceCardProps) {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      onClick={onSelect}
      className={cn(
        'service-card group',
        selected && 'selected'
      )}
    >
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center gap-3">
          <div className={cn(
            'p-2 rounded-lg transition-colors',
            selected ? 'bg-primary/20' : 'bg-muted'
          )}>
            <Scissors className={cn(
              'w-5 h-5',
              selected ? 'text-primary' : 'text-muted-foreground'
            )} />
          </div>
          <h3 className="text-lg font-serif font-semibold">{service.name}</h3>
        </div>
        <span className="text-2xl font-bold text-primary">
          {service.price} KM
        </span>
      </div>
      
      {service.description && (
        <p className="text-muted-foreground text-sm mb-4">
          {service.description}
        </p>
      )}
      
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Clock className="w-4 h-4" />
        <span>30 minuta</span>
      </div>

      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4"
        >
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
