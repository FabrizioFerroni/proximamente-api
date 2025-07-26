import { Router } from "express";
import { updatePassword, updateUser } from "../controllers/user.controller";
import { adminAuth } from "../middleware/auth";
import { decryptHeaderBodyMiddleware } from "../middleware/decryptHeaderBody.middleware";
import {
  updatePasswordUser,
  updateInfoUser,
} from "../validations/user.validation";

const router = Router();

router.put(
  "/user/info/:id",
  [decryptHeaderBodyMiddleware, adminAuth],
  updateInfoUser,
  updateUser
);
router.put(
  "/user/password/:id",
  [decryptHeaderBodyMiddleware, adminAuth],
  updatePasswordUser,
  updatePassword
);

export default router;
