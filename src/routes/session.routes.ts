import { Router } from "express";
import {
  getUserSessions,
  getUserSessionsPaginated,
} from "../controllers/session.controller";
import { adminAuth } from "../middleware/auth";
import { paginationDtoV } from "../validations/generyc.validation";
import { Logger } from "../common/logger";

const router = Router();

router.get("/sessions", adminAuth, paginationDtoV, getUserSessionsPaginated);
router.get("/sessions/all", adminAuth, getUserSessions);

Logger.log("Rutas de sesiones cargadas", "SesionesRoute");
export default router;
