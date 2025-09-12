// Types pour le Super Admin Service
export interface SuperAdminUser {
  id: string;
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  is_email_verified: boolean;
  status: string;
  is_super_admin: boolean;
  created_at: Date;
  last_login_at: Date | null;
}

export interface SuperAdminSelect {
  id: boolean;
  email: boolean;
  username: boolean;
  firstname: boolean;
  lastname: boolean;
  is_email_verified: boolean;
  status: boolean;
  is_super_admin: boolean;
  created_at: boolean;
  last_login_at: boolean;
}

export interface SuperAdminCreateData {
  email: string;
  username: string;
  firstname: string;
  lastname: string;
  password: string;
  is_email_verified: boolean;
  gender: string;
  is_super_admin: boolean;
  status: string;
}
