export type AppMode = 'club' | 'municipalite';

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
