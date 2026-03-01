import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Service } from '@/types/database';
import { ServiceCard } from './ServiceCard';

interface ServicesSectionProps {
  onSelectService: (service: Service) => void;
}

export function ServicesSection({ onSelectService }: ServicesSectionProps) {
  const [services, setServices] = useState<Service[]>([]);

  useEffect(() => {
    fetchServices();
  }, []);

  const fetchServices = async () => {
    const { data, error } = await supabase.
    from('services').
    select('*').
    eq('is_active', true).
    order('price');

    if (!error && data) {
      setServices(data);
    }
  };

  return (
    <section id="services" className="py-24 relative">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16">

          <span className="text-primary text-sm font-medium uppercase tracking-wider">PONUDA

          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-3 mb-4">Usluge & Cjenovnik

          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">


          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-2 max-w-4xl mx-auto">
          {services.map((service, index) =>
          <motion.div
            key={service.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}>

              <ServiceCard
              service={service}
              selected={false}
              onSelect={() => onSelectService(service)} />

            </motion.div>
          )}
        </div>
      </div>
    </section>);

}