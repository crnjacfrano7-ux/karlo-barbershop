export interface Service {
  id: string;
  name: string;
  description: string | null;
  price: number;
  duration_minutes: number;
  is_active: boolean;
  created_at: string;
}

export interface Barber {
  id: string;
  name: string;
  bio: string | null;
  avatar_url: string | null;
  specialties: string[] | null;
  is_active: boolean;
  created_at: string;
}

export interface Appointment {
  id: string;
  user_id: string;
  barber_id: string;
  service_id: string;
  appointment_date: string;
  appointment_time: string;
  status: 'pending' | 'confirmed' | 'completed' | 'cancelled';
  notes: string | null;
  created_at: string;
  updated_at: string;
  // Joined data
  barber?: Barber;
  service?: Service;
  profile?: {
    full_name: string | null;
    phone: string | null;
  };
}

export interface Profile {
  id: string;
  user_id: string;
  full_name: string | null;
  phone: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface UserRole {
  id: string;
  user_id: string;
  role: 'admin' | 'barber' | 'customer';
}

export interface BookingState {
  step: number;
  service: Service | null;
  barber: Barber | null;
  date: Date | null;
  time: string | null;
}
