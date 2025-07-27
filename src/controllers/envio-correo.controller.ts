import { Request, Response } from "express";
import { EnvioCorreosService } from "../services/envio-correo.service";
import { PaginationDto } from "../utils/dtos/pagination.dto";

const service = new EnvioCorreosService();

export const getReport = async (req: Request, res: Response) => {
  const data = await service.getReport();
  res.json(data);
};

export const listAllEnvios = async (req: Request, res: Response) => {
  const { query } = req;

  let dto: PaginationDto = {
    page: 1,
    limit: 10,
  };

  if (query.page || query.limit) {
    dto = query as PaginationDto;
  }

  const data = await service.listEnvioCorreosPaginated(dto);
  res.json(data);
};
