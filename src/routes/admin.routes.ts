import { Router } from "express";
import {
  list,
  exportCsv,
  report,
  listAll,
} from "../controllers/admin.controller";
import { adminAuth } from "../middleware/auth";
import { paginationDtoV } from "../validations/generyc.validation";

const router = Router();

router.get("/admin/notifications", adminAuth, paginationDtoV, list);
router.get("/admin/notifications/all", adminAuth, listAll);
router.get("/admin/export", adminAuth, exportCsv);
router.get("/admin/report", adminAuth, report);

export default router;
