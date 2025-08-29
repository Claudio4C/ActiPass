export interface JwtRefreshPayload {
  sub: string;
  email: string;
  iat?: number;
  exp?: number;
}
