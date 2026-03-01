import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ServiceCard } from './ServiceCard';
import { Service } from '@/types/database';
import { useToast } from '@/hooks/use-toast';

interface ServicesSectionProps {
  onSelectService: (service: Service) => void;
}

export function ServicesSection({ onSelectService }: ServicesSectionProps) {
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    async function fetchServices() {
      const { data, error } = await supabase
        .from('services')
        .select('*')
        .eq('is_active', true)
        .order('price', { ascending: true });

      if (error) {
        toast({
          title: 'Greška',
          description: 'Nije moguće učitati usluge.',
          variant: 'destructive',
        });
      } else {
        setServices(data || []);
      }
      setLoading(false);
    }
    fetchServices();
  }, [toast]);

  if (loading) return null;

  return (
    <section id="services" className="py-24 bg-background">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-serif font-bold mb-4">Usluge & Cjenovnik</h2>
          <div className="w-20 h-1 bg-primary mx-auto" />
        </div>

        {/* KLJUČNI DIO ZA CENTRIRANJE */}
        <div className="flex flex-wrap justify-center gap-6 max-w-5xl mx-auto">
          {services.map((service) => (
            <div 
              key={service.id} 
              className="w-full md:w-[calc(50%-1.5rem)] lg:max-w-[450px]"
            >
              <ServiceCard
                service={service}
                selected={false}
                onSelect={() => onSelectService(service)}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}