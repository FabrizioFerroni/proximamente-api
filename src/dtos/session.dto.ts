export interface CreateSessionDto {
  jti: string;
  usuario_id: string;
  ip: string;
  user_agent: string;
  system_operative: string;
  browser: string;
  device: string;
  location: string;
  expires_at: Date;
}

export interface UserAgentResponseDto {
  ip: string;
  os: string;
  browser: string;
  device: string;
  location: string;
}

export interface UpdateSessionDto {
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
}

export interface SessionResponseDto {
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
