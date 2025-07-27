import SQL from "sql-template-strings";
import dayjs from "../helpers/time";
import { randomUUID } from "crypto";
import { pool } from "../config/db.config";
import {
  EnviosCorreosDto,
  EnviosCorreosReportDto,
} from "../dtos/envios-correos.dto";
import { RowDataPacket } from "mysql2";
import { EnvioCorreosModel } from "../model/envios-correos.model";
import { Logger } from "../common/logger";
import { buildRawQuery } from "../utils/functions/rawQuery.function";

export class EnvioCorreosRepository {
  async saveSendMail(data: EnviosCorreosDto): Promise<boolean> {
    const now = dayjs().toDate();
    const { success, message, messageId, name, email, metodo } = data;
    const query = SQL`
          INSERT INTO envios_correos (id, success, message, message_id, name, email, method, send_at) 
          VALUES (${randomUUID()}, ${success}, ${message}, ${messageId}, ${name}, ${email}, ${metodo}, ${now})
      `;
    Logger.log(`SQL: ${buildRawQuery(query)}`, "EnvioCorreosRepository");
    const [result] = (await pool.query(query)) as any as [
      { affectedRows: number }
    ];
    return result.affectedRows > 0;
  }

  async getAllEmailsCorreosPaginate(
    skip: number,
    take: number
  ): Promise<[EnvioCorreosModel[], number]> {
    const limit = Number(take);
    const offset = Number(skip);

    const query = SQL`
       SELECT 
          ROW_NUMBER() OVER (ORDER BY ec.send_at ASC) AS row_num,
          ec.id, 
          ec.success,
          ec.message,
          ec.message_id,
          ec.name, 
          ec.email, 
          ec.method, 
          ec.send_at 
      FROM envios_correos AS ec 
      ORDER BY ec.send_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
      `;

    const queryCount = SQL`
      SELECT
          COUNT(ec.id) AS total
      FROM envios_correos AS ec
      `;
    Logger.log(
      `SQL: ${buildRawQuery(query)} && SQL COUNT: ${buildRawQuery(queryCount)}`,
      "EnvioCorreosRepository"
    );
    const [rows] = await pool.query<RowDataPacket[]>(query);
    const [rowsCount] = await pool.query<RowDataPacket[]>(queryCount);
    return [rows as EnvioCorreosModel[], rowsCount[0].total as number];
  }

  async getReport(): Promise<EnviosCorreosReportDto> {
    const query = SQL`
      SELECT 
        -- Total general
        COUNT(ec.id) AS total,

        -- Total de hoy
        COUNT(CASE 
          WHEN ec.send_at >= CONVERT_TZ(CURDATE(), '+00:00', '-03:00') 
          AND ec.send_at < CONVERT_TZ(CURDATE() + INTERVAL 1 DAY, '+00:00', '-03:00') 
        THEN 0 END) AS hoy,

        -- Total de la semana
        COUNT(CASE 
          WHEN ec.send_at >= CONVERT_TZ(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), '+00:00', '-03:00')
          AND ec.send_at <  CONVERT_TZ(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY), '+00:00', '-03:00') 
        THEN 0 END) AS semana,

        -- Total con success = true
        COUNT(CASE 
            WHEN ec.success = 1 
            THEN 1 END) AS success_true,

        -- Total con success = false
        COUNT(CASE 
            WHEN ec.success = 0 
            THEN 1 END) AS success_false
      FROM envios_correos AS ec    
    `;
    Logger.log(`SQL: ${buildRawQuery(query)}`, "EnvioCorreosRepository");
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows[0] as EnviosCorreosReportDto;
  }
}
