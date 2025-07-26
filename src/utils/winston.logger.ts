import winston from "winston";
import DailyRotateFile from "winston-daily-rotate-file";
import { config } from "dotenv";
import dayjs from "dayjs";

config();

const transportApi = new DailyRotateFile({
  filename: `./logs/${process.env.APP}-%DATE%.log`,
  datePattern: "DD-MM-YYYY",
  zippedArchive: true,
  maxSize: "10m",
  maxFiles: "15d",
});

const transportApiError = new DailyRotateFile({
  filename: `./logs/errors-${process.env.APP}-%DATE%.log`,
  datePattern: "DD-MM-YYYY",
  zippedArchive: true,
  maxSize: "10m",
  maxFiles: "15d",
  level: "error",
});

const appendTimestamp = winston.format((info: any) =>
  Object.assign(info, { timestamp: dayjs().format() })
);

const logger = winston.createLogger({
  level: process.env.LOG_LEVEL ?? "info",
  format: winston.format.combine(
    winston.format.splat(),
    winston.format.metadata(),
    appendTimestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json()
  ),
  transports: [transportApi, transportApiError],
});

export { logger };
