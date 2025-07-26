export interface RegisterUserDto {
  name: string;
  lastname: string;
  username: string;
  password: string;
}

export interface LoginUserDto {
  username: string;
  password: string;
}

export interface TwoFactorAuthDto {
  twofa_secret: string;
}

export interface UpdateUserDto {
  name?: string;
  lastname?: string;
  username?: string;
  password?: string;
  is_2fa_enabled?: boolean;
  twofa_secret?: string | null;
  twofa_temp_secret?: string | null;
  login_secret?: string | null;
}

export interface UserDto {
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

export interface UserResponseDto {
  id: string;
  name: string;
  lastname: string;
  username: string;
  is_2fa_enabled?: boolean;
  twofa_secret?: string | null;
  twofa_temp_secret?: string | null;
  login_secret?: string | null;
  token?: string;
  refreshToken?: string;
}

export interface UserActivate2fa {
  token: string;
}

export interface UserProfile {
  id: string;
  name: string;
  lastname: string;
  username: string;
  is_2fa_enabled: boolean;
  twofa_temp_secret?: string | null;
}

export interface UserInfoUpdateDto {
  name: string;
  lastname: string;
}

export interface UserUpdatePasswordDto {
  passwordActual: string;
  newPassword: string;
  confirmNewPassword: string;
}
