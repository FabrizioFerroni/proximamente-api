import { Request, Response, NextFunction } from "express";
import { HttpException } from "../common/exceptions/HttpException";
import { config } from "dotenv";
config();
/**
 * Middleware to handle errors in the application.
 * It catches errors thrown in the request lifecycle and formats them into a response.
 *
 * @param {any} err - The error object thrown during request processing.
 * @param {Request} _req - The Express request object (not used).
 * @param {Response} res - The Express response object to send the error response.
 * @param {NextFunction} _next - The next middleware function (not used).
 */
export function errorHandler(
  err: any,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const statusCode: number =
    err instanceof HttpException ? err.statusCode : 500;
  const message: string = err.message || "Error interno del servidor";
  const entorno: string = process.env.NODE_ENV || "development";

  if (entorno === "production") {
    res.status(statusCode).json({
      message: message,
      path: _req.url,
      status_code: statusCode,
      timestamp: new Date().toISOString(),
    });
  } else {
    res.status(statusCode).json({
      messageException: err.stack,
      message: message,
      path: _req.url,
      status_code: statusCode,
      timestamp: new Date().toISOString(),
    });
  }
}
