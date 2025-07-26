import { Request, Response } from "express";
import { NotificationService } from "../services/notification.service";
import { PaginationDto } from "../utils/dtos/pagination.dto";

const service = new NotificationService();

export const list = async (req: Request, res: Response) => {
  const { query } = req;

  let dto: PaginationDto = {
    page: 1,
    limit: 10,
  };

  if (query.page || query.limit) {
    dto = query as PaginationDto;
  }

  const data = await service.listNotificationPaginated(dto);
  res.json(data);
};

export const listAll = async (_req: Request, res: Response) => {
  const data = await service.listNotifications();
  res.json(data);
};

export const exportCsv = async (_req: Request, res: Response) => {
  const csv = await service.exportCsv();
  res.setHeader("Content-Type", "text/csv");
  res.setHeader(
    "Content-Disposition",
    'attachment; filename="notificaciones.csv"'
  );
  res.send(csv);
};

export const report = async (_req: Request, res: Response) => {
  const data = await service.getReport();
  res.json(data);
};
