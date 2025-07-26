import { BadRequestException } from "../common/exceptions/BadRequestException";
import { InternalServerErrorException } from "../common/exceptions/InternalServerErrorException";
import { Logger } from "../common/logger";
import { CreateNotificationDto } from "../dtos/create-notification.dto";
import {
  NotifyN8NResponseDto,
  NotifyResponseDto,
} from "../dtos/notify-response.dto";
import { NotificationReportDto } from "../dtos/report-response-notify.dto";
import { NotificationModel } from "../model/notification.model";
import { NotificationRepository } from "../repositories/notification.repository";
import { json2csv } from "json-2-csv";
import { formatDate } from "./../utils/formatDate";
import { logger } from "../utils/winston.logger";
import { PaginationDto } from "../utils/dtos/pagination.dto";
import { DefaultPageSize } from "../utils/constants/querying";
import { PaginationService } from "./pagination.service";
import {
  generateTokenDes,
  validateTokenDes,
} from "../utils/functions/token.function";
import { config } from "dotenv";
import { sendMail } from "../mail/mail.config";
import { UpdateNotificationDto } from "../dtos/update-notification.dto";
import dayjs from "dayjs";
import axios from "axios";
config();

export class NotificationService {
  private repo = new NotificationRepository();
  private serviceName = NotificationService.name;
  private paginationService = new PaginationService();

  async createNotification(data: CreateNotificationDto) {
    const { name, email } = data;

    try {
      await this.validateEmail(email);

      const now = dayjs().startOf("second").toDate();

      const result = await this.repo.save(name, email, true, now);

      if (!result) {
        throw new InternalServerErrorException(
          "No se pudo guardar la notificación"
        );
      }

      const token = generateTokenDes(email, result.created_at!);

      const body = {
        name: name.split(" ")[0],
        email,
        urlApp: process.env.BASE_URL ?? "",
        githubUrl: process.env.GITHUB_URL ?? "",
        linkedinUrl: process.env.LINKEDIN_URL ?? "",
        year: new Date().getFullYear().toString(),
        mailinfo: process.env.MAIL_INFO ?? "",
        unsubscribeUrl: `${process.env.BASE_URL}/desubscribirse/${token}`,
      };

      await sendMail(
        name,
        email,
        "Nueva notificación",
        "send-notification",
        body
      );

      Logger.log(
        `Nueva notificación registrada: ${name} <${email}>`,
        this.serviceName
      );
    } catch (err: any) {
      if (process.env.NODE_ENV !== "production") {
        Logger.error(err.stack, this.serviceName);
      } else {
        logger.error(`Error al guardar notificación: ${err.message}`, {
          service: this.serviceName,
          stack: err.stack,
          metodo: "createNotification",
        });
        Logger.error(
          `Error al guardar notificación: ${err.message}`,
          this.serviceName
        );
      }
      throw err;
    }
  }

  async unsubscribeNotifications(token: string) {
    try {
      const { email, date } = validateTokenDes(token);
      const notification = await this.repo.getNotificationWithEmail(email);

      if (!notification) {
        throw new BadRequestException("Token inválido o ya se ha desactivado.");
      }

      const dbDate = dayjs(notification.created_at);

      const tokenDate = dayjs(date);

      Logger.log(
        `[Unsubscribe] Notificaciones desactivadas para: ${email}`,
        this.serviceName
      );

      Logger.log(
        `[Unsubscribe] Token generado el ${tokenDate.format(
          "DD-MM-YYYY HH:mm:ss"
        )} y en la BD se encuentra generado (${dbDate.format(
          "DD-MM-YYYY HH:mm:ss"
        )}).`,
        this.serviceName
      );

      if (tokenDate.isBefore(dbDate)) {
        throw new BadRequestException(
          `Token inválido: generado el ${tokenDate.format(
            "DD-MM-YYYY HH:mm:ss"
          )} antes del registro en BD (${dbDate.format(
            "DD-MM-YYYY HH:mm:ss"
          )}).`
        );
        // throw new BadRequestException("Token inválido o modificado.");
      }

      const data: UpdateNotificationDto = {
        name: notification.name,
        email: notification.email,
        status: false,
      };

      const response = await this.repo.updateNotification(
        notification.id,
        data
      );

      if (!response) {
        throw new BadRequestException(
          "No se pudo desactivar las notificaciones"
        );
      }

      const body = {
        name: notification.name.split(" ")[0],
        email,
        urlApp: process.env.BASE_URL ?? "",
        githubUrl: process.env.GITHUB_URL ?? "",
        linkedinUrl: process.env.LINKEDIN_URL ?? "",
        year: new Date().getFullYear().toString(),
        mailinfo: process.env.MAIL_INFO ?? "",
      };

      await sendMail(
        notification.name,
        email,
        "Lo siento, ya no recibirás notificaciones",
        "send-desuscription-notif",
        body
      );

      Logger.log(
        `[Unsubscribe] Notificaciones desactivadas para: ${email}`,
        this.serviceName
      );
      return "Notificaciones desactivadas correctamente.";
    } catch (err: any) {
      Logger.error(
        `Error al desactivar notificaciones: ${err}`,
        this.serviceName
      );
      logger.error(`Error al desactivar notificaciones: ${err.message}`, {
        service: this.serviceName,
        stack: err.stack,
        metodo: "unsubscribeNotifications",
      });
      throw err;
    }
  }

  async listNotificationPaginated(dto: PaginationDto) {
    try {
      const { page, limit } = dto;

      const take = limit ?? DefaultPageSize.NOTIFICATIONS;
      const skip = this.paginationService.calculateOffset(limit!, page!);

      const [resp, count] = await this.repo.getAllNotificationsPaginate(
        skip,
        take
      );

      if (!resp || resp.length === 0) {
        Logger.warn("No hay notificaciones registradas", this.serviceName);
        return [];
      }

      const respDto: NotifyResponseDto[] = resp.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        status: item.status ? "Activo" : "Inactivo",
        fecha: formatDate(item.created_at),
        row_num: item.row_num,
      }));

      const meta = this.paginationService.createMeta(limit!, page!, count);

      return {
        data: respDto,
        meta,
      };
    } catch (err: any) {
      Logger.error(`Error al obtener notificaciones: ${err}`, this.serviceName);
      logger.error(`Error al obtener notificaciones: ${err.message}`, {
        service: this.serviceName,
        stack: err.stack,
        metodo: "listNotificationPaginated",
      });
      throw err;
    }
  }

  async listNotifications(): Promise<NotifyResponseDto[]> {
    try {
      const resp: NotificationModel[] = await this.repo.getAll();
      if (!resp || resp.length === 0) {
        Logger.warn("No hay notificaciones registradas", this.serviceName);
        return [];
      }

      const respDto: NotifyResponseDto[] = resp.map((item) => ({
        id: item.id,
        name: item.name,
        email: item.email,
        status: item.status ? "Activo" : "Inactivo",
        fecha: formatDate(item.created_at),
        row_num: item.row_num,
      }));

      return respDto;
    } catch (err: any) {
      Logger.error(`Error al obtener notificaciones: ${err}`, this.serviceName);
      logger.error(`Error al obtener notificaciones: ${err.message}`, {
        service: this.serviceName,
        stack: err.stack,
        metodo: "listNotifications",
      });
      throw err;
    }
  }

  async exportCsv(): Promise<string> {
    try {
      const res = await this.listNotifications();

      const data = res.map((item) => ({
        name: item.name,
        email: item.email,
      }));

      return await json2csv(data, {
        excelBOM: true,
        delimiter: {
          field: ",",
          wrap: '"',
          eol: "\n",
        },
      });
    } catch (err: any) {
      Logger.error(`Error exportando CSV: ${err}`, this.serviceName);
      logger.error(`Error exportando CSV: ${err.message}`, {
        service: this.serviceName,
        stack: err.stack,
        metodo: "exportCsv",
      });
      throw err;
    }
  }

  async exportN8N(): Promise<{
    data: NotifyN8NResponseDto[];
  }> {
    try {
      const res: NotificationModel[] = await this.repo.getAll();

      const response: NotifyN8NResponseDto[] = [];

      for (let i = 0; i < res.length; i++) {
        const token = generateTokenDes(
          res[i].email,
          new Date(res[i].created_at)
        );

        response.push({
          name: res[i].name,
          email: res[i].email,
          status: res[i].status ? "Activo" : "Inactivo",
          unsubscribeUrl: `${process.env.BASE_URL}/desubscribirse/${token}`,
        });
      }

      return { data: response };
    } catch (err: any) {
      Logger.error(`Error exportando a N8N: ${err}`, this.serviceName);
      logger.error(`Error exportando a N8N: ${err.message}`, {
        service: this.serviceName,
        stack: err.stack,
        metodo: "exportN8N",
      });
      throw err;
    }
  }

  async getReport(): Promise<NotificationReportDto> {
    try {
      const report = await this.repo.getReport();
      Logger.log(
        `Reporte generado: ${JSON.stringify(report)}`,
        this.serviceName
      );
      return report;
    } catch (err: any) {
      Logger.error(`Error al generar reporte: ${err}`, this.serviceName);
      logger.error(`Error al generar reporte: ${err.message}`, {
        service: this.serviceName,
        stack: err.stack,
        metodo: "getReport",
      });
      throw err;
    }
  }

  async sendAllNotificationAuto(): Promise<unknown> {
    try {
      const body = {
        url: process.env.HOST_FRONTEND ?? "",
        year: new Date().getFullYear(),
      };

      const response = await axios.post(process.env.N8N_URL ?? "", body);

      if (response.status !== 200) {
        Logger.error(
          `Error al enviar las notificaciones: ${response.data}`,
          this.serviceName
        );
        logger.error(`Error al enviar las notificaciones: ${response.data}`, {
          service: this.serviceName,
          metodo: "sendAllNotificationAuto",
        });
        throw new BadRequestException(
          "Hubo un error al enviar las notificaciones"
        );
      }

      Logger.log(
        `Notificaciones enviadas: ${JSON.stringify(response.data)}`,
        this.serviceName
      );

      return response.data;
    } catch (err: any) {
      Logger.error(
        `Error al enviar las notificaciones: ${err}`,
        this.serviceName
      );
      logger.error(`Error al enviar las notificaciones: ${err.message}`, {
        service: this.serviceName,
        stack: err.stack,
        metodo: "sendAllNotificationAuto",
      });
      throw err;
    }
  }

  private async validateEmail(email: string): Promise<void> {
    const exists = await this.repo.validateEmail(email);
    Logger.log(
      `Validando email: ${email} - Existe: ${exists}`,
      this.serviceName
    );
    if (exists) {
      Logger.error(`Email ya registrado: ${email}`, this.serviceName);
      logger.error(`Email ya registrado: ${email}`, {
        service: this.serviceName,
        metodo: "validateEmail",
      });
      throw new BadRequestException("El email ya está registrado");
    }
  }
}
