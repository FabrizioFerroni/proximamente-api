export interface UserNotification {
  id: string;
  name: string;
  lastname: string;
  username: string;
  password: string;
  is_2fa_enabled: boolean;
  twofa_secret?: string | null;
  twofa_temp_secret?: string | null;
  login_secret?: string | null;
  created_at: Date;
}
