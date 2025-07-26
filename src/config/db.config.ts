import mysql from "mysql2/promise";
import { config } from "dotenv";
import { Logger } from "../common/logger";
import { logger } from "../utils/winston.logger";
process.env.DOTENV_KEY;
process.env.DOTENV_LOG;
config();

export const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  port: Number(process.env.DB_PORT),
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  enableKeepAlive: true,
  keepAliveInitialDelay: 0,
  multipleStatements: true,
  charset: "utf8mb4_spanish2_ci",
  dateStrings: true,
  timezone: process.env.TZ_BD,
  connectTimeout: 10000,
});

async function connectWithRetry(retries = 5, delay = 3000) {
  for (let i = 0; i < retries; i++) {
    try {
      const conn = await pool.getConnection();
      await conn.ping();
      conn.release();
      logger.info("La conexión a la base de datos se ha establecido con éxito");
      Logger.log("Conexión exitosa a la base de datos.", "DB Connection");
      return;
    } catch (err) {
      Logger.warn(
        `Fallo en la conexión a DB. Reintento ${i + 1}/${retries}...`,
        "DB Connection"
      );
      await new Promise((res) => setTimeout(res, delay));
    }
  }

  Logger.error(
    "No se pudo conectar a la base de datos tras varios intentos.",
    "DB Connection"
  );
  process.exit(1);
}

connectWithRetry();
