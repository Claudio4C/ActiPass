export interface User {
  is_super_admin?: boolean;
  id: string;
  email: string;
  password: string | null;
  firstname: string;
  lastname: string;
  phone: string | null;
  birthdate: Date | null;
  gender: 'male' | 'female' | 'prefer_not_to_say';
  avatar_url: string | null;
  username: string;
  is_email_verified: boolean;
  is_minor: boolean;
  last_login_at: Date | null;
  status: 'active' | 'suspended' | 'pending' | 'locked';
  refresh_token_hash: string | null;
  password_reset_token: string | null;
  password_reset_expires: Date | null;
  email_verification_token: string | null;
  email_verification_expires: Date | null;
  failed_login_attempts: number;
  locked_until: Date | null;
  two_factor_enabled: boolean;
  two_factor_secret: string | null;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

export type SafeUser = Omit<User, 'password' | 'refresh_token_hash'>;
