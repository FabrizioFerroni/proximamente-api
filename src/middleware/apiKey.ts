import { config } from "dotenv";
import { Request, Response, NextFunction } from "express";

config();

const VALID_API_KEYS = [process.env.API_KEY]; // o una lista si necesitás varias

export function apiKeyAuth(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  const apiKey = req.header("x-api-key");

  if (!apiKey || !VALID_API_KEYS.includes(apiKey)) {
    res
      .status(401)
      .json({ message: "Unauthorized: Invalid or missing API Key" });
  }

  next();
}
