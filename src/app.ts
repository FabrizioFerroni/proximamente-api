import { config } from "dotenv";
import express, { Request, Response } from "express";
import bodyParser from "body-parser";
import cors from "cors";
import authRoutes from "./routes/auth.routes";
import notifyRoutes from "./routes/notify.routes";
import adminRoutes from "./routes/admin.routes";
import sessionRoutes from "./routes/session.routes";
import userRoutes from "./routes/user.routes";
import { Logger } from "./common/logger";
import { errorHandler } from "./middleware/errorHandler";
import { logger } from "./utils/winston.logger";
import passport from "./config/passport.config";
import useragent from "express-useragent";
import helmet from "helmet";
import https from "https";
import fs from "fs";
import path from "path";

config();

const { API_PORT, NODE_ENV: entorno } = process.env;

const app = express();
const port = API_PORT || 3000;

app.use(useragent.express());

app.use(passport.initialize());

const proxy = process.env.TRUST_PROXY === "true" ? true : false;

app.set("trust proxy", proxy || true);

const allowedOrigins = process.env.HOST_FRONT!.split(",");

const corsOptions = {
  origin: (origin: any, callback: any) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) {
      return callback(null, true);
    } else {
      return callback(new Error("No permitido por CORS"));
    }
  },
  credentials: true, // si usás cookies o auth headers
};

app.use(cors(corsOptions));

app.use(bodyParser.json({ limit: "50mb" }));
app.use(bodyParser.urlencoded({ extended: true }));

// Helmet
app.use(helmet());
app.use(helmet.ieNoOpen());
// Sets "Strict-Transport-Security: max-age=5184000; includeSubDomains".
const sixtyDaysInSeconds = 5184000;
app.use(
  helmet.hsts({
    maxAge: sixtyDaysInSeconds,
    includeSubDomains: true,
    preload: true,
  })
);
// Sets "X-Content-Type-Options: nosniff".
app.use(helmet.noSniff());
app.use(helmet.frameguard({ action: "deny" }));

app.use("/auth", authRoutes);
app.use("/api", notifyRoutes);
app.use("/api", sessionRoutes);
app.use("/api", adminRoutes);
app.use("/api", userRoutes);

app.use(errorHandler);

app.get("/favicon.ico", (req: Request, res: Response) => {
  res.status(204);
});

app.disable("x-powered-by");
app.get("/", (req: Request, res: Response) => {
  res.json({
    message: `Bienvenido a la api de proximamente api. Hecha por Fabrizio Ferroni`,
  });
});

app.get("/api", (req: Request, res: Response) => {
  res.json({
    message:
      "Bienvenido a la api de proximamente api. Hecha por Fabrizio Ferroni.",
  });
});

app.disable("x-powered-by");

if (entorno === "development") {
  const sslOptions = {
    key: fs.readFileSync(path.join(__dirname, "../certs/localhost+3-key.pem")),
    cert: fs.readFileSync(path.join(__dirname, "../certs/localhost+3.pem")),
  };

  https.createServer(sslOptions, app).listen(3000, () => {
    logger.info(
      `El servidor HTTPS se ejecuta en el puerto: ${port} sin problemas. En el entorno de: ${app.get(
        "env"
      )}`
    );
    Logger.log(
      `El servidor HTTPS se ejecuta en el puerto: ${port} sin problemas. En el entorno de: ${app.get(
        "env"
      )}`,
      "App Initialization"
    );
  });
} else {
  app.listen(port, () => {
    logger.info(
      `El servidor se ejecuta en el puerto: ${port} sin problemas. En el entorno de: ${app.get(
        "env"
      )}`
    );
    Logger.log(
      `El servidor se ejecuta en el puerto: ${port} sin problemas. En el entorno de: ${app.get(
        "env"
      )}`,
      "App Initialization"
    );
  });
}
