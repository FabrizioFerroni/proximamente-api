import { config } from "dotenv";
import fs from "fs";
import nodemailer from "nodemailer";
import smtpTransport from "nodemailer-smtp-transport";
import Handlebars from "handlebars";
import ejs from "ejs";
import { logger } from "../utils/winston.logger";
import { Logger } from "../common/logger";

config();

const host = process.env.HOST_MAIL ?? "smtp.mailtrap.io";
const port = process.env.PORT_MAIL ?? "2525";
const name = process.env.NAME_MAIL;
const user = process.env.USER_MAIL;
const pass = process.env.PASS_MAIL;
const secure = process.env.SECURE_MAIL ?? false;
const ciphers = process.env.CIPHERS_MAIL ?? "SSLv3";
const entorno = process.env.NODE_ENV;

export const sendMail = async (
  nameUser: string,
  email: string,
  subject: string,
  plantilla: string,
  body: Record<string, string>
) => {
  let readHTMLFile = function (path: any, callback: any) {
    fs.readFile(path, { encoding: "utf-8" }, function (err, html) {
      if (err) {
        throw err;
        callback(err);
      } else {
        callback(null, html);
      }
    });
  };

  let transporter: any = null;

  if (entorno === "development") {
    transporter = nodemailer.createTransport(
      smtpTransport({
        host: host,
        port: +port!,
        auth: {
          user: user,
          pass: pass,
        },
      })
    );
  }

  if (entorno === "production") {
    transporter = nodemailer.createTransport(
      smtpTransport({
        host: host,
        port: +port!,
        secure: secure === "true" ? true : false,
        auth: {
          user: user,
          pass: pass,
        },
        tls: {
          ciphers: ciphers,
        },
      })
    );
  }

  readHTMLFile(
    process.cwd() + `/src/mail/page/${plantilla}.html`,
    (err: any, html: any) => {
      let rest_html = ejs.render(html, body);

      let template = Handlebars.compile(rest_html);
      let htmlToSend = template({ op: true });

      let mailOptions = {
        from: `${name} <${user}>`,
        to: `${nameUser} <${email}>`,
        subject: subject,
        html: htmlToSend,
      };

      transporter.sendMail(mailOptions, function (error: any, info: any) {
        if (error) {
          logger.error(`${error}`);
          Logger.error(`${error}`, "Mail");
          return;
        }
        Logger.log(`Email enviado: ${info.response}`, "Mail");
        logger.info(`Email enviado: ${info.response}`);
      });
    }
  );
};
