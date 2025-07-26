export interface SessionModel {
  id: string;
  jti: string;
  usuario_id: string;
  ip: string;
  user_agent: string;
  system_operative: string;
  browser: string;
  device: string;
  location: string;
  is_revoked: boolean;
  expires_at: Date;
  created_at: Date;
}
