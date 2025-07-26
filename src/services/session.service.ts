import { logger } from "../utils/winston.logger";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { config } from "dotenv";
import { SessionRepository } from "../repositories/session.repository";
import {
  CreateSessionDto,
  UpdateSessionDto,
  UserAgentResponseDto,
} from "../dtos/session.dto";
import { UAParser } from "ua-parser-js";
import { NotFoundException } from "../common/exceptions/NotFoundException";
import { UserResponseDto } from "../dtos/user.dto";
import { Logger } from "../common/logger";
import { InternalServerErrorException } from "../common/exceptions/InternalServerErrorException";
import { BadRequestException } from "../common/exceptions/BadRequestException";
import { UserRepository } from "../repositories/user.repository";
import dayjs from "../helpers/time";
import { networkInterfaces } from "os";
import { PaginationDto } from "../utils/dtos/pagination.dto";
import { DefaultPageSize } from "../utils/constants/querying";
import { PaginationService } from "./pagination.service";
config();

export class SessionService {
  private repo = new SessionRepository();
  private userRepo = new UserRepository();
  private serviceName = SessionService.name;
  private paginationService = new PaginationService();

  async getAllSessionByUser(userId: string): Promise<any[]> {
    try {
      const sessions = (await this.repo.getAllSessionsWithUserId(
        userId,
        false
      )) as any;
      let response: any[] = [];

      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i] as any;

        let data: any = {
          id: session.id,
          jti: session.jti,
          ip: session.ip,
          user_agent: session.user_agent,
          system_operative: session.system_operative,
          browser: session.browser,
          device: session.device,
          location: session.location,
          is_revoked: session.is_revoked ? true : false,
          expires_at: session.expires_at,
        };

        const user = await this.userRepo.getUserById(session.usuario_id);

        if (user) {
          data = {
            ...data,
            user: {
              name: user.name,
              lastname: user.lastname,
              username: user.username,
            },
            createdAt: session.created_at,
            timeAlive: dayjs(session.created_at).fromNow(),
          };
        }

        response.push(data);
      }
      return response;
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al guardar la sesion del usuario: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "getAllSessionByUser",
        });
        Logger.error(
          `Error al guardar la sesion del usuario: ${err.message}`,
          this.serviceName
        );
      }
      throw err;
    }
  }

  async getAllSessionsByUserPaginated(userId: string, dto: PaginationDto) {
    try {
      const { page, limit } = dto;

      const take = limit ?? DefaultPageSize.SESSIONS;
      const skip = this.paginationService.calculateOffset(limit!, page!);

      const [data, count] = await this.repo.getAllSessionsWithUserIdPaginate(
        userId,
        false,
        skip,
        take
      );

      const sessions = await this.transformResponse(data as any);

      const meta = this.paginationService.createMeta(limit!, page!, count);

      return {
        data: sessions,
        meta,
      };
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al guardar la sesion del usuario: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "getAllSessionsByUserPaginated",
        });
        Logger.error(
          `Error al guardar la sesion del usuario: ${err.message}`,
          this.serviceName
        );
      }
      throw err;
    }
  }

  async saveSession(
    authorization: string,
    Iduser: string,
    userAgent: string,
    xForwardedFor: string | string[],
    remoteAddress: string
  ) {
    const token = authorization?.split(" ")[1];

    if (!token) {
      throw new NotFoundException("Token no proporcionado");
    }

    const user = await this.userRepo.getUserById(Iduser);

    if (!user) {
      throw new NotFoundException("El usuario no existe");
    }

    if (!userAgent) {
      throw new BadRequestException("No hay un user agent valido");
    }

    try {
      const dataFromUserAgent: UserAgentResponseDto =
        await this.getDataFromUserAgent(
          userAgent,
          xForwardedFor,
          remoteAddress
        );
      const { ip, os, browser, device, location } = dataFromUserAgent;

      const decoded: JwtPayload = jwt.verify(
        token,
        process.env.JWT_ACCESS_SECRET!
      ) as JwtPayload;

      const sesionWithJti = await this.repo.validateJti(decoded.jti!);

      if (sesionWithJti) {
        throw new BadRequestException("Ya existe una sesion con el mismo jti");
      }

      const data: CreateSessionDto = {
        jti: decoded.jti!,
        usuario_id: user.id,
        ip,
        user_agent: userAgent,
        system_operative: os,
        browser,
        device,
        location,
        expires_at: new Date(decoded.exp! * 1000),
      };

      const sesionCreated = await this.repo.saveSession(data);

      if (!sesionCreated) {
        throw new InternalServerErrorException(
          "No se pudo guardar la sesion del usuario"
        );
      }

      Logger.log(
        `Nuevo sesion registrada para el usuario: ${user.name} ${user.lastname}, <${user.username}>`,
        this.serviceName
      );
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al guardar la sesion del usuario: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "saveSession",
        });
        Logger.error(
          `Error al guardar la sesion del usuario: ${err.message}`,
          this.serviceName
        );
      }
      throw err;
    }
  }

  async revokeSession(jti: string): Promise<boolean> {
    try {
      const session = await this.repo.getSessionWithJti(jti, false);

      if (!session) {
        throw new NotFoundException("No se encontro la sesion");
      }

      const data: UpdateSessionDto = {
        jti: session.jti,
        usuario_id: session.usuario_id,
        ip: session.ip,
        user_agent: session.user_agent,
        system_operative: session.system_operative,
        browser: session.browser,
        device: session.device,
        location: session.location,
        is_revoked: true,
        expires_at: session.expires_at,
      };

      const result = await this.repo.updateSession(session.id, data);

      if (!result) {
        throw new InternalServerErrorException(
          "No se pudo borrar la sesion del usuario"
        );
      }

      return result;
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al borrar la sesion del usuario: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "revokeSession",
        });
        Logger.error(
          `Error al borrar la sesion del usuario: ${err.message}`,
          this.serviceName
        );
      }
      throw err;
    }
  }

  async revokeAllSession(id: string) {
    try {
      const sessions = await this.repo.getAllSessionsWithUserId(id, false);

      if (!sessions) {
        throw new NotFoundException("No se encontro la sesion");
      }

      let updatedCount = 0;

      if (sessions.length === 0) {
        return updatedCount;
      }

      for (let i = 0; i < sessions.length; i++) {
        const session = sessions[i];

        const data: UpdateSessionDto = {
          jti: session.jti,
          usuario_id: session.usuario_id,
          ip: session.ip,
          user_agent: session.user_agent,
          system_operative: session.system_operative,
          browser: session.browser,
          device: session.device,
          location: session.location,
          is_revoked: true,
          expires_at: session.expires_at,
        };

        const result = await this.repo.updateSession(session.id, data);

        if (!result) {
          throw new InternalServerErrorException(
            "No se pudo borrar la sesion del usuario"
          );
        }

        updatedCount++;
      }

      return { revoked: updatedCount };
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al borrar la sesion del usuario: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "revokeAllSession",
        });
        Logger.error(
          `Error al borrar la sesion del usuario: ${err.message}`,
          this.serviceName
        );
      }
      throw err;
    }
  }

  private getClientIP(
    xForwardedFor: string | string[],
    remoteAddress: string
  ): string {
    const rawIP =
      (xForwardedFor as string)?.split(",")[0]?.trim() || remoteAddress || "";

    const match = rawIP.match(/(\d{1,3}\.){3}\d{1,3}/);

    const lanIp = this.getIpLan();

    return match ? match[0] : lanIp;
  }

  private getIpLan(): string {
    const nets = networkInterfaces();

    for (const name of Object.keys(nets)) {
      if (name.toLowerCase().includes("lan")) {
        for (const net of nets[name]!) {
          const familyV4Value = typeof net.family === "string" ? "IPv4" : 4;
          if (net.family === familyV4Value && !net.internal) {
            return net.address;
          }
        }
      }
    }

    return "127.0.0.1";
  }

  private async getDataFromUserAgent(
    userAgent: string,
    xForwardedFor: string | string[],
    remoteAddress: string
  ): Promise<UserAgentResponseDto> {
    const ip = this.getClientIP(xForwardedFor, remoteAddress);

    const ua = new UAParser(userAgent);
    const result = ua.getResult();

    const browser = `${result.browser.name ?? "Unknown"} ${
      result.browser.version ?? ""
    }`.trim();
    const os = `${result.os.name ?? ""} ${result.os.version ?? ""}`.trim();

    let device = "Unknown Device";

    if (result.device.model) {
      device = `${result.device.vendor ?? ""} ${result.device.model}`.trim();
    } else if (result.os.name?.toLowerCase().includes("windows")) {
      device = "Windows PC";
    } else if (result.os.name?.toLowerCase().includes("mac")) {
      device = "Mac";
    } else if (result.os.name?.toLowerCase().includes("k")) {
      device = "Mobile";
    } else if (result.device.type === "mobile") {
      device = "Mobile";
    } else if (result.device.type === "tablet") {
      device = "Tablet";
    }

    let location: any = {};

    let locationEnd: string = "Unknown Location";

    if (
      ip !== "127.0.0.1" &&
      ip !== "::1" &&
      ip !== "unknown" &&
      ip !== "" &&
      ip !== null &&
      ip !== undefined &&
      ip !== "localhost" &&
      !ip.startsWith("192.168.")
    ) {
      const apiKey = process.env.IP_API_KEY;
      try {
        const res = await fetch(`https://api.ipapi.is/?q=${ip}&key=${apiKey}`, {
          headers: {
            "User-Agent": userAgent,
          },
        });
        const data = await res.json();
        location = data.location;
        locationEnd = `${location.city} - ${location.state}, ${location.country}`;
      } catch (err: any) {
        if (process.env.NODE_ENV !== "production") {
          Logger.error(err.stack, this.serviceName);
        } else {
          logger.error(`Error al obtener la ubicacion: ${err.message}`, {
            service: this.serviceName,
            stack: err.stack,
            metodo: "getDataFromUserAgent",
          });
          Logger.error(
            `Error al obtener la ubicacion: ${err.message}`,
            this.serviceName
          );
        }
      }
    }

    return {
      ip,
      os,
      browser,
      device,
      location: locationEnd,
    };
  }

  private async transformResponse(sessions: any) {
    let response: any[] = [];

    for (let i = 0; i < sessions.length; i++) {
      const session = sessions[i] as any;

      let data: any = {
        id: session.id,
        jti: session.jti,
        ip: session.ip,
        user_agent: session.user_agent,
        system_operative: session.system_operative,
        browser: session.browser,
        device: session.device,
        location: session.location,
        is_revoked: session.is_revoked ? true : false,
        expires_at: session.expires_at,
      };

      const user = await this.userRepo.getUserById(session.usuario_id);

      if (user) {
        data = {
          ...data,
          user: {
            name: user.name,
            lastname: user.lastname,
            username: user.username,
          },
          createdAt: session.created_at,
          timeAlive: dayjs(session.created_at).fromNow(),
        };
      }

      response.push(data);
    }
    return response;
  }
}
