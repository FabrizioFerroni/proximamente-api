import { Router } from "express";
import {
  disable2FA,
  enable2FA,
  generate2FA,
  getProfile,
  login,
  logout,
  logoutAll,
  logoutuser,
  refreshToken,
  registerUser,
  validateToken,
  verifyLogin2FA,
} from "../controllers/auth.controller";
import {
  disable2FAValid,
  enable2FAValid,
  login_user,
  register_user,
  verify2FA,
} from "../validations/user.validation";
import { adminAuth } from "../middleware/auth";
import { refresh_token } from "../validations/auth.validation";
import { decryptHeaderBodyMiddleware } from "../middleware/decryptHeaderBody.middleware";
import { Logger } from "../common/logger";

const router = Router();

router.get("/perfil", adminAuth, getProfile);
router.get("/validate-token", validateToken);

router.post(
  "/registrarse",
  [decryptHeaderBodyMiddleware],
  register_user,
  registerUser
);
router.post("/iniciarsesion", [decryptHeaderBodyMiddleware], login_user, login);
router.post(
  "/iniciarsesion/2fa-verificar",
  [decryptHeaderBodyMiddleware],
  verify2FA,
  verifyLogin2FA
);
//TODO: cuando el usuario haga click en el boton de cancel del configurar 2fa borrar temp_secret
router.post("/2fa/generar", adminAuth, generate2FA);
router.post(
  "/2fa/activar",
  [decryptHeaderBodyMiddleware, adminAuth],
  enable2FAValid,
  enable2FA
);
router.post(
  "/2fa/desactivar",
  [decryptHeaderBodyMiddleware, adminAuth],
  disable2FAValid,
  disable2FA
);
router.post("/cerrarsesion", adminAuth, logoutuser);
router.post("/cerrarsesion/jti/:jti", adminAuth, logout);
router.post("/cerrarsesion/usuario", adminAuth, logoutAll);
router.post(
  "/refresh-token",
  [decryptHeaderBodyMiddleware],
  refresh_token,
  refreshToken
);

Logger.log("Rutas auth cargadas", "AuthRoute");
export default router;
