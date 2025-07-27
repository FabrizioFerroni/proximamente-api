import { config } from "dotenv";
import fs from "fs/promises";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import Handlebars from "handlebars";
import ejs from "ejs";
import { logger } from "../utils/winston.logger";
import { Logger } from "../common/logger";
import { EnvioCorreosRepository } from "../repositories/envio-correos.repository";
import { EnviosCorreosDto } from "../dtos/envios-correos.dto";

config();

const host = process.env.HOST_MAIL ?? "smtp.mailtrap.io";
const port = process.env.PORT_MAIL ?? "2525";
const name = process.env.NAME_MAIL;
const user = process.env.USER_MAIL;
const pass = process.env.PASS_MAIL;
const secure = process.env.SECURE_MAIL ?? false;
const ciphers = process.env.CIPHERS_MAIL ?? "SSLv3";
const entorno = process.env.NODE_ENV;
const emailCorreoRepo = new EnvioCorreosRepository();
const serviceName = "SendMail";

export const sendMail = async (
  nameUser: string,
  email: string,
  subject: string,
  plantilla: string,
  body: Record<string, string>,
  metodo: string
): Promise<{ success: boolean; message: string; messageId?: string }> => {
  try {
    // Leer archivo HTML con fs/promises
    const html = await fs.readFile(
      process.cwd() + `/src/mail/page/${plantilla}.html`,
      "utf-8"
    );

    const renderedHtml = ejs.render(html, body);
    const template = Handlebars.compile(renderedHtml);
    const htmlToSend = template({ op: true });

    const transporter = nodemailer.createTransport(
      smtpTransport({
        host,
        port: +port,
        secure: secure === "true",
        auth: { user, pass },
        ...(entorno === "production" && {
          tls: { ciphers },
        }),
      })
    );

    const mailOptions = {
      from: `${name} <${user}>`,
      to: `${nameUser} <${email}>`,
      subject,
      html: htmlToSend,
    };

    const info = await transporter.sendMail(mailOptions);

    Logger.log(`Email enviado: ${info.response}`, "Mail");
    logger.info(`Email enviado: ${info.response}`);

    const data: EnviosCorreosDto = {
      success: true,
      message: "Email enviado",
      messageId: info.messageId,
      name: nameUser,
      email: email,
      metodo,
    };

    const resp = await emailCorreoRepo.saveSendMail(data);

    if (!resp) {
      Logger.error(
        `Error al guardar notificación a ${email}: ${info.response}`,
        serviceName
      );
      logger.error(
        `Error al guardar notificación a ${email}: ${info.response}`,
        {
          service: serviceName,
          stack: info.messageId,
          metodo: "sendMail",
        }
      );
    }

    Logger.log(
      `Envio de notificaciones finalizado y guardado en la BD para ${nameUser} <${email}>`,
      serviceName
    );

    return {
      success: true,
      message: "Email enviado",
      messageId: info.messageId,
    };
  } catch (error: any) {
    const errorMsg = `Error al enviar el correo: ${error.message || error}`;
    logger.error(`${error}`);
    Logger.error(`${error}`, "Mail");

    const data: EnviosCorreosDto = {
      success: true,
      message: errorMsg,
      name: nameUser,
      email: email,
      metodo,
    };

    const resp = await emailCorreoRepo.saveSendMail(data);

    if (!resp) {
      Logger.error(
        `Error al guardar notificación a ${email}: ${error.message}`,
        serviceName
      );
      logger.error(
        `Error al guardar notificación a ${email}: ${error.message}`,
        {
          service: serviceName,
          stack: error.message,
          metodo: "sendMail",
        }
      );
    }

    Logger.log(
      `Envio de notificaciones finalizado y guardado en la BD para ${nameUser} <${email}>`,
      serviceName
    );
    return {
      success: false,
      message: errorMsg,
    };
  }
};
