import { UserInfoUpdateDto, UserUpdatePasswordDto } from "../dtos/user.dto";
import { UserService } from "../services/user.service";
import { Request, Response } from "express";

const service = new UserService();

export const updateUser = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: UserInfoUpdateDto = req.body;
  const response = await service.updateUser(id, data);
  res.json(response);
};

export const updatePassword = async (req: Request, res: Response) => {
  const { id } = req.params;
  const data: UserUpdatePasswordDto = req.body;
  const response = await service.updatePasswordUser(id, data);
  res.json(response);
};
