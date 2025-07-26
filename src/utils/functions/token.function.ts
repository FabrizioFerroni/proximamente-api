import * as crypto from "crypto";
import { config } from "dotenv";
import { BadRequestException } from "../../common/exceptions/BadRequestException";
config();

export const generateTokenDes = (email: string, date: Date): string => {
  const secret = process.env.ENCRYPTION_KEY!;
  const signature = crypto
    .createHmac("sha256", secret)
    .update(email)
    .digest("hex");

  if (!(date instanceof Date)) {
    throw new Error(
      "generateTokenDes: parámetro 'date' debe ser un objeto Date"
    );
  }

  const payload = {
    email,
    date: date.toISOString(),
    signature,
  };

  const token = Buffer.from(JSON.stringify(payload)).toString("base64");

  return token;
};

export const validateTokenDes = (
  token: string
): { email: string; date: Date } => {
  const secret = process.env.ENCRYPTION_KEY!;
  const { email, date, signature } = JSON.parse(
    Buffer.from(token, "base64").toString()
  );
  const expectedSignature = crypto
    .createHmac("sha256", secret)
    .update(email)
    .digest("hex");

  if (signature !== expectedSignature) {
    throw new BadRequestException("Token inválido");
  }

  return { email, date: new Date(date) };
};
