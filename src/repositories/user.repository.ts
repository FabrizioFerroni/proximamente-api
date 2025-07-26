import SQL from "sql-template-strings";
import { pool } from "../config/db.config";
import { UpdateUserDto, UserDto } from "../dtos/user.dto";
import { RowDataPacket } from "mysql2";
import { randomUUID } from "crypto";
import dayjs from "../helpers/time";

export class UserRepository {
  constructor() {}

  async register(
    name: string,
    lastname: string,
    username: string,
    password: string
  ): Promise<boolean> {
    const now = dayjs().toDate();
    const query = SQL`
        INSERT INTO usuarios (id, name, lastname, username, password, created_at) 
        VALUES (${randomUUID()}, ${name}, ${lastname}, ${username}, ${password}, ${now})
    `;

    const [result] = (await pool.query(query)) as any as [
      { affectedRows: number }
    ];
    return result.affectedRows > 0;
  }

  async getUserById(id: string): Promise<UserDto | null> {
    const query = SQL`
        SELECT 
            u.id, 
            u.name, 
            u.lastname, 
            u.username, 
            u.password, 
            u.is_2fa_enabled, 
            u.twofa_secret,
            u.twofa_temp_secret,
            u.login_secret
        FROM usuarios AS u 
        WHERE u.id = ${id}`;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    if (rows.length > 0) {
      return rows[0] as UserDto;
    }
    return null;
  }

  async getUserByUsername(username: string): Promise<UserDto | null> {
    const query = SQL`
    SELECT 
        u.id, 
        u.name, 
        u.lastname, 
        u.username, 
        u.password, 
        u.is_2fa_enabled, 
        u.twofa_secret,
        u.twofa_temp_secret,
        u.login_secret
    FROM usuarios AS u 
    WHERE u.username = ${username}`;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    if (rows.length > 0) {
      return rows[0] as UserDto;
    }
    return null;
  }

  async validateUsername(username: string): Promise<boolean> {
    const query = SQL`
        SELECT 0 FROM usuarios AS u WHERE u.username = ${username}
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows.length > 0;
  }

  async validateLoginSecret(loginSecret: string): Promise<boolean> {
    const query = SQL`
        SELECT 0 FROM usuarios AS u WHERE u.login_secret = ${loginSecret}
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows.length > 0;
  }

  async getUserByLoginSecret(loginSecret: string): Promise<UserDto | null> {
    const query = SQL`
        SELECT 
            u.id, 
            u.name, 
            u.lastname, 
            u.username, 
            u.password, 
            u.is_2fa_enabled, 
            u.twofa_secret,
            u.twofa_temp_secret,
            u.login_secret
        FROM usuarios AS u 
        WHERE u.login_secret = ${loginSecret}`;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    if (rows.length > 0) {
      return rows[0] as UserDto;
    }
    return null;
  }

  async countUserTotal(): Promise<number> {
    const query = SQL`
        SELECT COUNT(u.id) AS total FROM usuarios AS u
    `;

    const [rows] = await pool.query<RowDataPacket[]>(query);
    return rows[0].total as number;
  }

  async updateUser(id: string, data: UpdateUserDto): Promise<boolean> {
    const {
      name,
      lastname,
      username,
      password,
      is_2fa_enabled,
      twofa_secret,
      twofa_temp_secret,
      login_secret,
    } = data;

    const query = SQL`
    UPDATE usuarios AS u
    SET u.name = ${name},
        u.lastname = ${lastname},
        u.username = ${username},
        u.password = ${password},
        u.is_2fa_enabled = ${is_2fa_enabled},
        u.twofa_secret = ${twofa_secret},
        u.twofa_temp_secret = ${twofa_temp_secret},
        u.login_secret = ${login_secret}
    WHERE u.id = ${id};
    `;

    const [result] = (await pool.query(query)) as any as [
      { affectedRows: number }
    ];
    return result.affectedRows > 0;
  }
}
