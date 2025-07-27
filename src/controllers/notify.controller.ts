import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
import { CreateNotificationDto } from "../dtos/create-notification.dto";

const service = new NotificationService();

export const notify = async (req: Request, res: Response) => {
  const data: CreateNotificationDto = req.body;
  await service.createNotification(data);
  res.json({ message: "Guardado correctamente" });
};

export const unsubscribe = async (req: Request, res: Response) => {
  const { token } = req.params;
  const response = await service.unsubscribeNotifications(token);
  res.json({ message: response });
};

export const exportN8N = async (req: Request, res: Response) => {
  const data = await service.exportN8N();
  res.json(data);
};

export const sendAllNotificationN8N = async (req: Request, res: Response) => {
  // const data = await service.sendAllNotificationAuto();
  const data = await service.sendAllNotificationMail();
  res.json(data);
};
