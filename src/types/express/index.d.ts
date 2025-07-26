declare global {
  namespace Express {
    interface Request {
      session?: {
        jti: string;
      };
    }
  }
}
