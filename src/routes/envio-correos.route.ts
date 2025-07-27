import { Router } from "express";
import { adminAuth } from "../middleware/auth";
import {
  getReport,
  listAllEnvios,
} from "../controllers/envio-correo.controller";
import { Logger } from "../common/logger";

const router = Router();

router.get("/correos-enviados", adminAuth, listAllEnvios);
router.get("/correos-enviados/report", adminAuth, getReport);

Logger.log("Rutas de envio de correos cargadas", "EnvioCorreosRoute");
export default router;
