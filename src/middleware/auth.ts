import { Request, Response, NextFunction } from "express";
import { HttpException } from "../common/exceptions/HttpException";
import passport from "passport";
import { UserResponseDto } from "../dtos/user.dto";
import jwt, { JwtPayload, SignOptions } from "jsonwebtoken";
import { SessionRepository } from "../repositories/session.repository";

export function adminAuth(
  req: Request & { session?: { jti: string } },
  res: Response,
  next: NextFunction
): void {
  passport.authenticate(
    "jwt",
    { session: false },
    async (err: any, user: UserResponseDto, info: any) => {
      if (err) {
        return next(err);
      }
      if (!user) {
        return next(new HttpException(401, "No autorizado"));
      }

      try {
        const authHeader = req.headers["authorization"];
        const token = authHeader?.split(" ")[1];
        const sessionRepo = new SessionRepository();

        if (!token) {
          return next(new HttpException(401, "Token no enviado"));
        }

        const decoded: JwtPayload = jwt.verify(
          token,
          process.env.JWT_ACCESS_SECRET!
        ) as JwtPayload;

        if (!decoded?.jti) {
          return next(new HttpException(401, "Token inválido"));
        }

        const session = await sessionRepo.getRevokedSession(decoded.jti);

        if (!session || session.is_revoked || session.expires_at < new Date()) {
          return next(new HttpException(401, "Sesión inválida o cerrada"));
        }

        req.user = user;
        req.session = { jti: decoded.jti };
        next();
      } catch (e) {
        console.error("Error en validación de sesión:", e);
        return next(new HttpException(500, "Error interno"));
      }
    }
  )(req, res, next);
}
