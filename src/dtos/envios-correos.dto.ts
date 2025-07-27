export interface EnviosCorreosDto {
  success: boolean;
  message: string;
  messageId?: string;
  name: string;
  email: string;
  metodo: string;
}

export interface EnviosCorreosReportDto {
  total: number;
  hoy: number;
  semana: number;
  success_true: number;
  success_false: number;
}

export interface EmailCorreoResponseDto {
  id: string;
  success: string;
  message: string;
  messageId?: string;
  name: string;
  email: string;
  method: string;
  fecha: string;
  row_num?: number;
}
