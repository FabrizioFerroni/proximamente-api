import SQL from "sql-template-strings";
import { pool } from "../config/db.config";
import { RowDataPacket } from "mysql2";
import { randomUUID } from "crypto";
import dayjs from "../helpers/time";
import {
  CreateSessionDto,
  SessionResponseDto,
  UpdateSessionDto,
} from "../dtos/session.dto";
export class SessionRepository {
  async saveSession(data: CreateSessionDto): Promise<boolean> {
    const now = dayjs().toDate();
    const {
      jti,
      usuario_id,
      ip,
      user_agent,
      system_operative,
      browser,
      device,
      location,
      expires_at,
    } = data;
    const query = SQL`
          INSERT INTO sesiones (id, jti, usuario_id, ip, user_agent, system_operative, browser, device, location, expires_at, created_at) 
          VALUES (${randomUUID()}, ${jti}, ${usuario_id}, ${ip}, ${user_agent}, ${system_operative}, ${browser}, ${device}, ${location}, ${expires_at}, ${now})
      `;
    const [result] = (await pool.query(query)) as any as [
      { affectedRows: number }
    ];
    return result.affectedRows > 0;
  }

  async validateJti(jti: string): Promise<boolean> {
    const query = SQL`
          SELECT 0 FROM sesiones AS s WHERE s.jti = ${jti}
      `;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows.length > 0;
  }

  async getSessionWithJti(
    jti: string,
    revoked: boolean
  ): Promise<SessionResponseDto> {
    const query = SQL`
    SELECT 
        s.id, 
        s.jti, 
        s.usuario_id, 
        s.ip, 
        s.user_agent, 
        s.system_operative, 
        s.browser, 
        s.device, 
        s.location, 
        s.is_revoked,
        s.expires_at,
        s.created_at 
    FROM sesiones AS s
    WHERE s.jti = ${jti}
    AND s.is_revoked = ${revoked}
    LIMIT 1
      `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows[0] as SessionResponseDto;
  }

  async getAllSessionsWithUserId(
    userId: string,
    revoked: boolean
  ): Promise<SessionResponseDto[]> {
    const query = SQL`
    SELECT 
        s.id, 
        s.jti, 
        s.usuario_id, 
        s.ip, 
        s.user_agent, 
        s.system_operative, 
        s.browser, 
        s.device, 
        s.location, 
        s.is_revoked,
        s.expires_at,
        s.created_at
    FROM sesiones AS s
    WHERE s.usuario_id = ${userId}
    AND s.is_revoked = ${revoked}
    ORDER BY s.created_at DESC
      `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows as SessionResponseDto[];
  }

  async getAllSessionsWithUserIdPaginate(
    userId: string,
    revoked: boolean,
    skip: number,
    take: number
  ): Promise<[SessionResponseDto[], number]> {
    const limit = Number(take);
    const offset = Number(skip);

    const query = SQL`
     SELECT 
        s.id, 
        s.jti, 
        s.usuario_id, 
        s.ip, 
        s.user_agent, 
        s.system_operative, 
        s.browser, 
        s.device, 
        s.location, 
        s.is_revoked,
        s.expires_at,
        s.created_at
    FROM sesiones AS s
    WHERE s.usuario_id = ${userId}
    AND s.is_revoked = ${revoked}
    ORDER BY s.created_at DESC
    LIMIT ${limit}
    OFFSET ${offset}
    `;

    const queryCount = SQL`
    SELECT
        COUNT(s.id) AS total
    FROM sesiones AS s
    WHERE s.usuario_id = ${userId}
    AND s.is_revoked = ${revoked}
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    const [rowsCount] = await pool.query<RowDataPacket[]>(queryCount);
    return [rows as SessionResponseDto[], rowsCount[0].total as number];
  }

  async getRevokedSession(jti: string) {
    const query = SQL`
    SELECT 
        s.is_revoked,
        s.expires_at
    FROM sesiones AS s
    WHERE s.jti = ${jti}
    LIMIT 1
      `;
    const [rows] = await pool.query<RowDataPacket[]>(query);
    return (
      (rows[0] as any as { is_revoked: boolean; expires_at: Date }) || null
    );
  }

  async updateSession(id: string, data: UpdateSessionDto): Promise<boolean> {
    const query = SQL`
    UPDATE sesiones AS s
    SET 
        s.jti = ${data.jti},
        s.usuario_id = ${data.usuario_id},
        s.ip = ${data.ip},
        s.user_agent = ${data.user_agent},
        s.system_operative = ${data.system_operative},
        s.browser = ${data.browser},
        s.device = ${data.device},
        s.location = ${data.location},
        s.is_revoked = ${data.is_revoked},
        s.expires_at = ${data.expires_at}
    WHERE s.id = ${id}
      `;
    const [result] = (await pool.query(query)) as any as [
      { affectedRows: number }
    ];
    return result.affectedRows > 0;
  }

  async deleteSession(jti: string): Promise<boolean> {
    const query = SQL`
    DELETE FROM sesiones AS s
    WHERE s.jti = ${jti}
      `;
    const [result] = (await pool.query(query)) as any as [
      { affectedRows: number }
    ];
    return result.affectedRows > 0;
  }
}
