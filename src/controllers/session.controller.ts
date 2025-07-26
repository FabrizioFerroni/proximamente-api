import { Request, Response } from "express";
import { SessionService } from "../services/session.service";
import { UserResponseDto } from "../dtos/user.dto";
import { PaginationDto } from "../utils/dtos/pagination.dto";

const service = new SessionService();

export const getUserSessions = async (req: Request, res: Response) => {
  const user = req.user as UserResponseDto;
  const response = await service.getAllSessionByUser(user!.id!);
  res.json(response);
};

export const getUserSessionsPaginated = async (req: Request, res: Response) => {
  const user = req.user as UserResponseDto;
  const { query } = req;

  let dto: PaginationDto = {
    page: 1,
    limit: 10,
  };

  if (query.page || query.limit) {
    dto = query as PaginationDto;
  }
  const response = await service.getAllSessionsByUserPaginated(user!.id!, dto);
  res.json(response);
};
