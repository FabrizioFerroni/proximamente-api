export interface NotificationModel {
  id: string;
  name: string;
  email: string;
  status: boolean;
  created_at: Date;
  row_num?: number;
}
