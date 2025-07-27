import { Router } from "express";
import {
  list,
  exportCsv,
  report,
  listAll,
} from "../controllers/admin.controller";
import { adminAuth } from "../middleware/auth";
import { paginationDtoV } from "../validations/generyc.validation";
import { Logger } from "../common/logger";

const router = Router();

router.get("/admin/notifications", adminAuth, paginationDtoV, list);
router.get("/admin/notifications/all", adminAuth, listAll);
router.get("/admin/export", adminAuth, exportCsv);
router.get("/admin/report", adminAuth, report);

Logger.log("Rutas admin cargadas", "AdminRoute");
export default router;
