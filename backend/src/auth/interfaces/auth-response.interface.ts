export interface SafeUser {
  id: string;
  email: string;
  firstname: string;
  lastname: string;
  phone?: string;
  birthdate?: Date;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  avatar_url?: string;
  username: string;
  is_email_verified: boolean;
  last_login_at?: Date;
  status: 'active' | 'suspended' | 'pending';
  created_at: Date;
  updated_at: Date;
}

export interface AuthResponse {
  user?: SafeUser;
  accessToken?: string;
  refreshToken?: string;
  message?: string;
}
