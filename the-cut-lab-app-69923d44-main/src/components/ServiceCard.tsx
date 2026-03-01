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
      /* mx-auto osigurava da je kartica u sredini svog stupca, a max-w-md sprečava da postane preširoka */
      className={cn(
        'service-card group w-full h-full relative mx-auto max-w-md flex flex-col',
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
          <h3
            className="text-lg font-serif font-semibold line-clamp-2 min-h-[3.5rem] flex items-center">
            {service.name}
          </h3>
        </div>
        <span className="text-2xl font-bold text-primary shrink-0 ml-2">
          {Number(service.price).toFixed(2)} KM
        </span>
      </div>
      
      {service.description && (
        <p className="text-muted-foreground text-sm mb-4 line-clamp-2 flex-grow">
          {service.description}
        </p>
      )}
      
      {/* Spacer koji gura donji dio kartice (sat) uvijek na dno */}
      {!service.description && <div className="flex-grow" />}

      <div className="flex items-center gap-2 text-sm text-muted-foreground mt-auto">
        <Clock className="w-4 h-4" />
        <span>{service.duration_minutes} minuta</span>
      </div>

      {selected && (
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="absolute top-4 right-4"
        >
          <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center shadow-lg">
            <svg className="w-4 h-4 text-primary-foreground" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          </div>
        </motion.div>
      )}
    </motion.div>
  );
}
