import { BadRequestException } from "../common/exceptions/BadRequestException";
import { InternalServerErrorException } from "../common/exceptions/InternalServerErrorException";
import { Logger } from "../common/logger";
import {
  RegisterUserDto,
  UpdateUserDto,
  UserActivate2fa,
  UserProfile,
  UserResponseDto,
} from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import { logger } from "../utils/winston.logger";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import speakeasy from "speakeasy";
import { encrypt, decrypt } from "../helpers/crypto.helper";
import { config } from "dotenv";
import { randomBytes } from "crypto";
import qrcode from "qrcode";
import { SessionService } from "./session.service";
import { Request } from "express";
import { SessionRepository } from "../repositories/session.repository";
import { NotFoundException } from "../common/exceptions/NotFoundException";
import { hashPassword } from "../utils/password.functions";
config();

export class AuthService {
  private repo = new UserRepository();
  private sessionRepo = new SessionRepository();
  private sesionService = new SessionService();
  private serviceName = AuthService.name;
  private readonly secret = process.env.JWT_ACCESS_SECRET || "supersecret";

  async register(dto: RegisterUserDto) {
    const { name, lastname, username } = dto;
    const userTotal = await this.repo.countUserTotal();

    if (userTotal > 0) {
      throw new BadRequestException("El registro de usuarios está cerrado");
    }

    const userExists = await this.repo.validateUsername(username);
    if (userExists) {
      throw new BadRequestException(
        "El usuario con ese nombre de usuario ya existe"
      );
    }
    dto.password = await hashPassword(dto.password);

    try {
      const userCreated = await this.repo.register(
        name,
        lastname,
        username,
        dto.password
      );

      if (!userCreated) {
        throw new InternalServerErrorException("No se pudo guardar el usuario");
      }

      Logger.log(
        `Nuevo usuario registrado: ${dto.name} ${dto.lastname}, <${dto.username}>`,
        this.serviceName
      );
      return "Usuario registrado correctamente";
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al guardar el usuario: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "createNotification",
        });
        Logger.error(
          `Error al guardar el usuario: ${err.message}`,
          this.serviceName
        );
      }
      throw err;
    }
  }

  async login(user: UserResponseDto, req: Request): Promise<UserResponseDto> {
    const tokenPayload = {
      sub: user.id,
      username: user.username,
      jti: randomBytes(32).toString("hex"),
    };

    const accessToken = jwt.sign(tokenPayload, process.env.JWT_ACCESS_SECRET!, {
      expiresIn: process.env.JWT_ACCESS_EXPIRATION!,
    } as SignOptions);

    const refreshToken = jwt.sign(
      tokenPayload,
      process.env.JWT_REFRESH_SECRET!,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRATION!,
      } as SignOptions
    );

    const response: UserResponseDto = {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      is_2fa_enabled: user.is_2fa_enabled,
      twofa_temp_secret: user.twofa_temp_secret,
      token: accessToken,
      refreshToken: refreshToken,
    };

    await this.sesionService.saveSession(
      `Bearer ${accessToken}`,
      user.id,
      req.headers["user-agent"]!,
      req.headers["x-forwarded-for"] as string | string[],
      req.socket.remoteAddress!
    );

    return response;
  }

  async logout(jti: string): Promise<void> {
    //TODO: HAY QUE CAMBIAR ESTO...
    await this.sesionService.revokeSession(jti);
  }

  async logoutAll(user: UserResponseDto): Promise<void> {
    await this.sesionService.revokeAllSession(user.id);
  }

  async setTwoFactorTempSecret(
    id: string
  ): Promise<{ otpAuthUrl: string; base32Secret: string }> {
    try {
      const user = await this.repo.getUserById(id);
      if (!user) {
        throw new BadRequestException("El usuario no existe");
      }

      const { otpauth_url, base32 } = await this.getSecret(user.username);

      const userUpdated: UpdateUserDto = {
        name: user.name,
        lastname: user.lastname,
        username: user.username,
        password: user.password,
        is_2fa_enabled: user.is_2fa_enabled,
        twofa_secret: user.twofa_secret,
        twofa_temp_secret: encrypt(base32),
      };

      const result = await this.repo.updateUser(id, userUpdated);

      if (!result) {
        throw new InternalServerErrorException(
          "No se pudo guardar la clave secreta temporal"
        );
      }

      return {
        otpAuthUrl: await qrcode.toDataURL(otpauth_url!),
        base32Secret: base32,
      };
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al activar 2FA: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "createNotification",
        });
      }
      throw err;
    }
  }

  async activate2FAUser(id: string, dto: UserActivate2fa): Promise<string> {
    try {
      const { token } = dto;
      const user = await this.repo.getUserById(id);
      if (!user || !user.twofa_temp_secret) {
        throw new BadRequestException(
          "El usuario no existe o no tienes un secreto temporal"
        );
      }

      const decryptedSecret = decrypt(user.twofa_temp_secret);

      const validSecret = await this.validateSecretActivate(
        decryptedSecret,
        token
      );

      if (!validSecret) {
        throw new BadRequestException("El token es inválido");
      }

      const userUpdated: UpdateUserDto = {
        name: user.name,
        lastname: user.lastname,
        username: user.username,
        password: user.password,
        is_2fa_enabled: true,
        twofa_secret: user.twofa_temp_secret,
        twofa_temp_secret: null,
      };
      const result = await this.repo.updateUser(id, userUpdated);
      if (!result) {
        throw new InternalServerErrorException("No se pudo activar el 2FA");
      }
      return "2FA activado correctamente";
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al activar 2FA: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "createNotification",
        });
      }
      throw err;
    }
  }

  async validate2FA(
    loginSecret: string,
    dto: UserActivate2fa
  ): Promise<string> {
    try {
      const { token } = dto;
      const isValidLoginSecret = await this.repo.validateLoginSecret(
        loginSecret
      );

      if (!isValidLoginSecret) {
        throw new BadRequestException("El token es inválido");
      }

      const user = await this.repo.getUserByLoginSecret(loginSecret);

      if (!user || !user.twofa_secret) {
        throw new BadRequestException(
          "El usuario no existe o no tienes un secreto"
        );
      }

      const decryptedSecret = decrypt(user.twofa_secret);

      const validSecret = await this.validateSecretActivate(
        decryptedSecret,
        token
      );

      if (!validSecret) {
        throw new BadRequestException("El token es inválido");
      }

      await this.deleteLoginSecret(loginSecret);

      return user.id;
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al activar 2FA: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "validate2FA",
        });
      }
      throw err;
    }
  }

  async disable2FAUser(id: string): Promise<string> {
    try {
      const user = await this.repo.getUserById(id);
      if (!user) {
        throw new BadRequestException("El usuario no existe");
      }

      const userUpdated: UpdateUserDto = {
        name: user.name,
        lastname: user.lastname,
        username: user.username,
        password: user.password,
        is_2fa_enabled: false,
        twofa_secret: null,
        twofa_temp_secret: null,
      };
      const result = await this.repo.updateUser(id, userUpdated);
      if (!result) {
        throw new InternalServerErrorException("No se pudo desactivar el 2FA");
      }
      return "2FA desactivado correctamente";
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al activar 2FA: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "createNotification",
        });
      }
      throw err;
    }
  }

  async getUserByUsername(username: string): Promise<UserResponseDto> {
    const user = await this.repo.getUserByUsername(username);
    if (!user) {
      throw new BadRequestException("El usuario no existe");
    }

    const body: UserResponseDto = {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      is_2fa_enabled: user.is_2fa_enabled,
      twofa_secret: user.twofa_secret,
      twofa_temp_secret: user.twofa_temp_secret,
    };

    return body;
  }

  async getUserById(id: string): Promise<UserResponseDto> {
    const user = await this.repo.getUserById(id);
    if (!user) {
      throw new BadRequestException("El usuario no existe");
    }

    const body: UserResponseDto = {
      id: user.id,
      name: user.name,
      lastname: user.lastname,
      username: user.username,
      is_2fa_enabled: user.is_2fa_enabled,
      twofa_secret: user.twofa_secret,
      twofa_temp_secret: user.twofa_temp_secret,
    };

    return body;
  }

  async generateSecretTempLogin(username: string): Promise<string> {
    try {
      const user = await this.repo.getUserByUsername(username);

      if (!user) {
        throw new BadRequestException("El usuario no existe");
      }

      const login_secret: string = randomBytes(16).toString("hex");

      const userUpdated: UpdateUserDto = {
        name: user.name,
        lastname: user.lastname,
        username: user.username,
        password: user.password,
        is_2fa_enabled: user.is_2fa_enabled,
        twofa_secret: user.twofa_secret,
        twofa_temp_secret: user.twofa_temp_secret,
        login_secret,
      };

      const result = await this.repo.updateUser(user.id, userUpdated);

      if (!result) {
        throw new InternalServerErrorException("No se pudo activar el 2FA");
      }

      return login_secret;
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al activar 2FA: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "generateSecretTempLogin",
        });
      }
      throw err;
    }
  }

  async deleteLoginSecret(loginSecret: string): Promise<void> {
    try {
      const user = await this.repo.getUserByLoginSecret(loginSecret);

      if (!user) {
        throw new BadRequestException("El usuario no existe");
      }

      const userUpdated: UpdateUserDto = {
        name: user.name,
        lastname: user.lastname,
        username: user.username,
        password: user.password,
        is_2fa_enabled: user.is_2fa_enabled,
        twofa_secret: user.twofa_secret,
        twofa_temp_secret: user.twofa_temp_secret,
        login_secret: null,
      };

      const result = await this.repo.updateUser(user.id, userUpdated);

      if (!result) {
        throw new InternalServerErrorException(
          "No se pudo borrar el login secret del usuario"
        );
      }
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al borrar el login secret: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "deleteLoginSecret",
        });
      }
      throw err;
    }
  }

  async refreshToken(oldToken: string, req: Request): Promise<UserResponseDto> {
    try {
      const decoded: JwtPayload = jwt.verify(
        oldToken,
        process.env.JWT_REFRESH_SECRET!
      ) as JwtPayload;

      const sesionWithJti = await this.sessionRepo.validateJti(decoded.jti!);

      if (!sesionWithJti) {
        throw new BadRequestException("No se encontro la sesion");
      }

      const resultDelete = await this.sessionRepo.deleteSession(decoded.jti!);

      if (!resultDelete) {
        throw new InternalServerErrorException(
          "No se pudo borrar la sesion del usuario"
        );
      }

      const user: UserResponseDto = (await this.repo.getUserById(
        decoded.sub!
      )) as UserResponseDto;

      if (!user) {
        throw new BadRequestException("El usuario no existe");
      }

      return await this.login(user, req);
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al borrar el login secret: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "refreshToken",
        });
      }
      throw err;
    }
  }

  async getProfile(id: string): Promise<UserProfile> {
    try {
      const user = await this.repo.getUserById(id);

      if (!user) {
        throw new NotFoundException("El usuario no existe");
      }

      const response: UserProfile = {
        id: user.id,
        name: user.name,
        lastname: user.lastname,
        username: user.username,
        is_2fa_enabled: user.is_2fa_enabled,
        twofa_temp_secret: user.twofa_temp_secret,
      };

      return response;
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al borrar el login secret: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "refreshToken",
        });
      }
      throw err;
    }
  }

  verifyToken(token: string) {
    const verified = jwt.verify(token, this.secret);
    Logger.log(
      `Token verificado: ${JSON.stringify(verified)}`,
      this.serviceName
    );

    return verified;
  }

  private async getSecret(
    username: string
  ): Promise<speakeasy.GeneratedSecret> {
    const secret = speakeasy.generateSecret({
      name: `Proximamente App - Fabrizio Dev (${username})`,
    });

    return secret;
  }

  private async validateSecretActivate(
    secret: string,
    token: string
  ): Promise<boolean> {
    const isValid = speakeasy.totp.verify({
      secret,
      encoding: "base32",
      token,
      window: 1,
    });

    return isValid;
  }
}
