import { randomUUID } from "crypto";
import { pool } from "../config/db.config";
import { RowDataPacket } from "mysql2";
import { NotificationReportDto } from "../dtos/report-response-notify.dto";
import { NotificationModel } from "../model/notification.model";
import SQL from "sql-template-strings";
import dayjs from "../helpers/time";
import { UpdateNotificationDto } from "../dtos/update-notification.dto";
import { Logger } from "../common/logger";

export class NotificationRepository {
  async save(
    name: string,
    email: string,
    status: boolean = true,
    created_at: Date
  ): Promise<{ success: boolean; created_at: Date | null }> {
    const id = randomUUID();
    const queryInsert = SQL`
          INSERT INTO notificaciones (id, name, email, status, created_at) 
          VALUES (${id}, ${name}, ${email}, ${status}, ${created_at})
    `;

    const [result] = (await pool.query(queryInsert)) as any as [
      { affectedRows: number }
    ];

    if (result.affectedRows === 0) {
      return { success: false, created_at: null };
    }

    const querySelect = SQL`SELECT 
                              n.created_at 
                            FROM notificaciones as n 
                            WHERE id = ${id}`;
    const [rows] = (await pool.query(querySelect)) as any as [any[]];
    if (!rows.length) return { success: false, created_at: null };

    return { success: true, created_at: new Date(rows[0].created_at) };
  }

  async getAll(): Promise<NotificationModel[]> {
    const query = SQL`
        SELECT 
            ROW_NUMBER() OVER (ORDER BY n.created_at ASC) AS row_num,
            n.id, 
            n.name, 
            n.email, 
            n.status, 
            n.created_at 
        FROM notificaciones AS n 
        WHERE n.status = true
        ORDER BY n.created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows as NotificationModel[];
  }

  async getNotificationWithEmail(email: string): Promise<NotificationModel> {
    const query = SQL`
        SELECT 
            ROW_NUMBER() OVER (ORDER BY n.created_at ASC) AS row_num,
            n.id, 
            n.name, 
            n.email, 
            n.status, 
            n.created_at 
        FROM notificaciones AS n 
        WHERE n.email = ${email}
        AND n.status = true
        ORDER BY n.created_at DESC`;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows[0] as NotificationModel;
  }

  async getAllNotificationsPaginate(
    skip: number,
    take: number
  ): Promise<[NotificationModel[], number]> {
    const limit = Number(take);
    const offset = Number(skip);

    const query = SQL`
       SELECT 
          ROW_NUMBER() OVER (ORDER BY n.created_at ASC) AS row_num,
          n.id, 
          n.name, 
          n.email, 
          n.status, 
          n.created_at 
      FROM notificaciones AS n 
      WHERE n.status = true
      ORDER BY n.created_at DESC
      LIMIT ${limit}
      OFFSET ${offset}
      `;

    const queryCount = SQL`
      SELECT
          COUNT(n.id) AS total
      FROM notificaciones AS n
      WHERE n.status = true
      `;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    const [rowsCount] = await pool.query<RowDataPacket[]>(queryCount);
    return [rows as NotificationModel[], rowsCount[0].total as number];
  }

  async getReport(): Promise<NotificationReportDto> {
    const query = SQL`
      SELECT 
        COUNT(n.id) AS total,
        COUNT(CASE 
          WHEN n.created_at >= CONVERT_TZ(CURDATE(), '+00:00', '-03:00') 
          AND n.created_at < CONVERT_TZ(CURDATE() + INTERVAL 1 DAY, '+00:00', '-03:00') 
        THEN 0 END) AS hoy,
        COUNT(CASE 
          WHEN n.created_at >= CONVERT_TZ(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), '+00:00', '-03:00')
          AND n.created_at <  CONVERT_TZ(DATE_ADD(DATE_SUB(CURDATE(), INTERVAL WEEKDAY(CURDATE()) DAY), INTERVAL 7 DAY), '+00:00', '-03:00') 
        THEN 0 END) AS semana
      FROM notificaciones AS n
      WHERE n.status = true;    
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows[0] as NotificationReportDto;
  }

  async validateEmail(email: string): Promise<boolean> {
    const query = SQL`
      SELECT 0 FROM notificaciones AS n WHERE n.email = ${email}
    `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows.length > 0;
  }

  async updateNotification(
    id: string,
    data: UpdateNotificationDto
  ): Promise<boolean> {
    const query = SQL`
      UPDATE notificaciones AS n
      SET  
            n.name = ${data.name}, 
            n.email = ${data.email}, 
            n.status = ${data.status}
      WHERE n.id = ${id}
        `;
    const [result] = (await pool.query(query)) as any as [
      { affectedRows: number }
    ];
    return result.affectedRows > 0;
  }
}
