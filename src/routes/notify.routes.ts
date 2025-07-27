import { Router } from "express";
import {
  exportN8N,
  notify,
  sendAllNotificationN8N,
  unsubscribe,
} from "../controllers/notify.controller";
import { create_new_notification } from "../validations/notify.validation";
import decryptHeaderBodyMiddleware from "../middleware/decryptHeaderBody.middleware";
import { apiKeyAuth } from "../middleware/apiKey";
import { adminAuth } from "../middleware/auth";
import { Logger } from "../common/logger";

const router = Router();

router.post(
  "/notify",
  decryptHeaderBodyMiddleware,
  create_new_notification,
  notify
);

router.get("/unsubscribe/:token", unsubscribe);
router.get("/export/n8n", apiKeyAuth, exportN8N);
router.get("/notification/send/online", adminAuth, sendAllNotificationN8N);

Logger.log("Rutas notificaciones cargadas", "NotificationRoute");
export default router;
