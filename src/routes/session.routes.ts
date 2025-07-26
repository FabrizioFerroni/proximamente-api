import { Router } from "express";
import {
  getUserSessions,
  getUserSessionsPaginated,
} from "../controllers/session.controller";
import { adminAuth } from "../middleware/auth";
import { paginationDtoV } from "../validations/generyc.validation";

const router = Router();

router.get("/sessions", adminAuth, paginationDtoV, getUserSessionsPaginated);
router.get("/sessions/all", adminAuth, getUserSessions);

export default router;
