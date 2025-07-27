export interface EnvioCorreosModel {
  id: string;
  success: boolean;
  message: string;
  message_id?: string;
  name: string;
  email: string;
  method: string;
  send_at: Date;
  row_num?: number;
}
