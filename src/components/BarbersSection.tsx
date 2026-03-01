import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { supabase } from '@/integrations/supabase/client';
import { Barber } from '@/types/database';

export function BarbersSection() {
  const [barbers, setBarbers] = useState<Barber[]>([]);

  useEffect(() => {
    fetchBarbers();
  }, []);

  const fetchBarbers = async () => {
    const { data, error } = await supabase.
    from('barbers').
    select('*').
    eq('is_active', true);

    if (!error && data) {
      setBarbers(data);
    }
  };

  return (
    <section id="barbers" className="py-24 bg-gradient-section">
      <div className="container mx-auto px-4">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-16">

          <span className="text-primary text-sm font-medium uppercase tracking-wider">NAŠ TIM

          </span>
          <h2 className="text-4xl md:text-5xl font-serif font-bold mt-3 mb-4">ZAPOSLENICI

          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">

          </p>
        </motion.div>

        <div className="grid gap-8 md:grid-cols-3 max-w-5xl mx-auto">
          {barbers.map((barber, index) =>
          <motion.div
            key={barber.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: index * 0.1 }}
            className="glass-card p-6 text-center group">

              <div className="relative mb-6 inline-block">
                <div className="w-32 h-32 rounded-full overflow-hidden border-2 border-primary/20 group-hover:border-primary transition-colors mx-auto">
                  <img
                  src={barber.avatar_url || '/placeholder.svg'}
                  alt={barber.name}
                  className="w-full h-full object-cover" />

                </div>
                <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary rounded-full">
                  <span className="text-xs font-medium text-primary-foreground">Stručnjak</span>
                </div>
              </div>

              <h3 className="font-serif text-xl font-bold mb-2">{barber.name}</h3>
              <p className="text-muted-foreground text-sm mb-4">{barber.bio}</p>

              {barber.specialties && barber.specialties.length > 0 &&
            <div className="flex flex-wrap justify-center gap-2">
                  {barber.specialties.map((specialty, idx) =>
              <span
                key={idx}
                className="text-xs px-3 py-1 rounded-full bg-muted text-muted-foreground">

                      {specialty}
                    </span>
              )}
                </div>
            }
            </motion.div>
          )}
        </div>
      </div>
    </section>);

}