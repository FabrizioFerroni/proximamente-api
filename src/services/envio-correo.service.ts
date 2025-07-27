import { Logger } from "../common/logger";
import {
  EmailCorreoResponseDto,
  EnviosCorreosReportDto,
} from "../dtos/envios-correos.dto";
import { EnvioCorreosRepository } from "../repositories/envio-correos.repository";
import { DefaultPageSize } from "../utils/constants/querying";
import { PaginationDto } from "../utils/dtos/pagination.dto";
import { formatDate } from "../utils/formatDate";
import { logger } from "../utils/winston.logger";
import { PaginationService } from "./pagination.service";

export class EnvioCorreosService {
  private repo = new EnvioCorreosRepository();
  private serviceName = EnvioCorreosService.name;
  private paginationService = new PaginationService();

  async listEnvioCorreosPaginated(dto: PaginationDto) {
    try {
      const { page, limit } = dto;

      const take = limit ?? DefaultPageSize.ENVIOCORREO;
      const skip = this.paginationService.calculateOffset(limit!, page!);

      const [resp, count] = await this.repo.getAllEmailsCorreosPaginate(
        skip,
        take
      );

      if (!resp || resp.length === 0) {
        Logger.warn("No hay notificaciones registradas", this.serviceName);
        return [];
      }

      const respDto: EmailCorreoResponseDto[] = resp.map((item) => ({
        id: item.id,
        success: item.success ? "Enviado" : "Error al enviar",
        message: item.message,
        messageId: item.message_id ?? "",
        name: item.name,
        email: item.email,
        method: item.method,
        fecha: formatDate(item.send_at),
        row_num: item.row_num ?? 0,
      }));

      const meta = this.paginationService.createMeta(limit!, page!, count);

      return {
        data: respDto,
        meta,
      };
    } catch (err: any) {
      Logger.error(
        `Error al obtener envios de correo: ${err}`,
        this.serviceName
      );
      logger.error(`Error al obtener envios de correo: ${err.message}`, {
        service: this.serviceName,
        stack: err.stack,
        metodo: "listEnvioCorreosPaginated",
      });
      throw err;
    }
  }
  async getReport(): Promise<EnviosCorreosReportDto> {
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
}
