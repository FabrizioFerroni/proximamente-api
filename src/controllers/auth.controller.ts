import { NextFunction, Request, Response } from "express";
import {
  RegisterUserDto,
  UserActivate2fa,
  UserProfile,
  UserResponseDto,
} from "../dtos/user.dto";
import { AuthService } from "../services/auth.service";
import passport from "passport";
import { BadRequestException } from "../common/exceptions/BadRequestException";
import { SessionService } from "../services/session.service";
import { Logger } from "../common/logger";

const service = new AuthService();
const sesionService = new SessionService();

export const registerUser = async (req: Request, res: Response) => {
  const dto: RegisterUserDto = req.body;
  const result = await service.register(dto);
  res.status(201).json({ message: result });
};

export const login = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  passport.authenticate(
    "local",
    { session: false },
    async (err: Error, user: UserResponseDto, info: any) => {
      if (err) {
        return next(err);
      }

      if (!user) {
        return next(
          new BadRequestException(info?.message || "Credenciales inválidas")
        );
      }

      const loginSecret = await service.generateSecretTempLogin(user.username);

      if (user.is_2fa_enabled) {
        return res.status(200).json({
          message: "Two-factor authentication required",
          twoFactorEnabled: true,
          loginSecret,
        });
      }

      try {
        const tokens = await service.login(user, req);
        return res.status(200).json(tokens);
      } catch (error) {
        return next(error);
      }
    }
  )(req, res, next);
};

export const generate2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as UserResponseDto;
    const { otpAuthUrl, base32Secret } = await service.setTwoFactorTempSecret(
      user.id
    );

    res.status(200).json({ qrCodeUrl: otpAuthUrl, secret: base32Secret });
  } catch (error) {
    next(error);
  }
};

export const enable2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const user = req.user as UserResponseDto;
    const dto: UserActivate2fa = req.body;

    if (!dto.token) {
      return next(new BadRequestException("El token de 2FA es requerido"));
    }

    const isVerified = await service.activate2FAUser(user.id, dto);

    if (!isVerified) {
      return next(new BadRequestException("Token 2FA inválido."));
    }

    res.status(200).json({ message: isVerified });
  } catch (error) {
    next(error);
  }
};

export const disable2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { id } = req.body;

    if (!id) {
      return next(new BadRequestException("El token de 2FA es requerido"));
    }

    const isVerified = await service.disable2FAUser(id);

    res.status(200).json({ message: isVerified });
  } catch (error) {
    next(error);
  }
};

export const verifyLogin2FA = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const { loginSecret, token } = req.body;

    if (!loginSecret || !token) {
      return next(new BadRequestException("Se requiere login secret y token"));
    }

    const dto: UserActivate2fa = {
      token,
    };

    const userValidated = await service.validate2FA(loginSecret, dto);

    if (!userValidated) {
      return next(new BadRequestException("Token 2FA inválido."));
    }

    const user = await service.getUserById(userValidated);

    if (!user) return next(new BadRequestException("Usuario no encontrado"));

    const tokens = await service.login(user, req);
    res.status(200).json(tokens);
  } catch (error) {
    next(error);
  }
};

export const logoutuser = async (req: Request, res: Response) => {
  const { session } = req as Request & { session: { jti: string } };
  await service.logout(session.jti);
  res.json({ message: "Logout successfully" });
};

export const logout = async (req: Request, res: Response) => {
  const { jti } = req.params!;
  await service.logout(jti);
  res.json({ message: "Logout successfully" });
};

export const logoutAll = async (req: Request, res: Response) => {
  await service.logoutAll(req.user as UserResponseDto);
  res.json({ message: "Logout all sessions successfully" });
};

export const refreshToken = async (req: Request, res: Response) => {
  const { oldToken } = req.body;
  const userService = await service.refreshToken(oldToken, req);
  res.status(200).json(userService);
};

export const getProfile = async (req: Request, res: Response) => {
  const user = req.user as UserResponseDto;
  const response: UserProfile = await service.getProfile(user.id);
  res.json(response);
};

export const validateToken = async (req: Request, res: Response) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      res.status(401).json({ message: "Token no proporcionado" });
      return;
    }

    const payload = service.verifyToken(token!);
    res.status(200).json({ valid: true, payload });
  } catch (error: any) {
    Logger.error(error, "AuthController");
    res
      .status(401)
      .json({ valid: false, message: "Token inválido o expirado" });
  }
};
