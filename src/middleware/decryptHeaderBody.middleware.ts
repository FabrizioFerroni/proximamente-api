import { Request, Response, NextFunction, RequestHandler } from "express";
import { DecryptCredentialsService } from "../services/decrypt-credentials.service";

const decryptService = new DecryptCredentialsService();

export const decryptHeaderBodyMiddleware = (
  req: Request,
  res: Response,
  next: NextFunction
): ReturnType<RequestHandler> => {
  const header = req.headers["basic"];

  if (!header || typeof header !== "string") {
    res.status(400).json({ error: 'Missing or invalid "basic" header' });
    return;
  }

  try {
    const decrypted = decryptService.main(header);
    req.body = decrypted;
    next();
  } catch (err) {
    res
      .status(401)
      .json({ error: "Invalid credentials format or decryption failed" });
  }
};

export default decryptHeaderBodyMiddleware;
