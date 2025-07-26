export interface NotifyResponseDto {
  id: string;
  name: string;
  email: string;
  status: string;
  fecha: string;
  row_num?: number;
}

export interface NotifyN8NResponseDto {
  name: string;
  email: string;
  status: string;
  unsubscribeUrl: string;
}
