export type AppMode = 'club' | 'municipalite';

export type RoleType = 'club_owner' | 'club_manager' | 'treasurer' | 'coach' | 'member';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  organizationName?: string;
  phone?: string;
  mode: AppMode;
  is_super_admin?: boolean;
}

export interface Organisation {
  id: string;
  name: string;
  description?: string;
  type?: 'club' | 'association';
}

export interface Membership {
  id: string;
  organisationId: string;
  organisation?: Organisation;
  role: {
    id: string;
    name: string;
    type: RoleType;
    level: number;
  };
  joined_at: string;
  left_at?: string | null;
}

export interface Permission {
  resource: string;
  action: string;
  scope: 'own' | 'organisation' | 'global';
}

export interface AuthContextType {
  user: User | null;
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  login: (email: string, password: string) => Promise<void>;
  register: (userData: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
  error: string | null;
  clearError: () => void;
}

export interface RegisterData {
  firstname: string;
  lastname: string;
  email: string;
  password: string;
  confirmPassword: string;
  username: string;
  phone?: string;
  mode: AppMode;
  acceptTerms: boolean;
  gender?: 'male' | 'female' | 'prefer_not_to_say';
  birthdate?: string;
  address?: string;
  city?: string;
  country?: string;
  postalCode?: string;
  bio?: string;
}

export interface LoginData {
  email: string;
  password: string;
  rememberMe: boolean;
  mode: AppMode;
}

export type EventType = 'training' | 'match' | 'meeting' | 'workshop' | 'other';
export type EventVisibility = 'public' | 'members_only' | 'private';
export type EventStatus = 'draft' | 'published' | 'cancelled';
export type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'attended' | 'missed';

export interface Event {
  id: string;
  organisation_id: string;
  title: string;
  description?: string;
  event_type: EventType;
  start_time: string;
  end_time: string;
  location?: string;
  created_by_id: string;
  visibility: EventVisibility;
  capacity?: number;
  registration_required: boolean;
  price: number;
  is_recurring: boolean;
  recurrence_pattern?: string;
  status: EventStatus;
  cover_url?: string;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  created_by?: {
    id: string;
    firstname: string;
    lastname: string;
    email?: string;
  };
  organisation?: {
    id: string;
    name: string;
  };
  current_registrations?: number;
  available_spots?: number | null;
}

export interface Reservation {
  id: string;
  membership_id: string;
  event_id: string;
  status: ReservationStatus;
  payment_id?: string;
  note?: string;
  rating?: number;
  created_at: string;
  updated_at: string;
  deleted_at?: string | null;
  membership?: {
    id: string;
    user: {
      id: string;
      firstname: string;
      lastname: string;
      email: string;
    };
  };
}
