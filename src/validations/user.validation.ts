import { body } from "express-validator";
import { Request, Response, NextFunction } from "express";
import validateResult from "../helpers/validation.helper";

export const login_user = [
  body("username")
    .notEmpty()
    .withMessage("El campo de nombre de usuario es obligatorio."),
  body("password")
    .notEmpty()
    .withMessage("El campo de contraseña es obligatorio.")
    .isLength({ min: 6, max: 20 })
    .withMessage("La contraseña debe tener entre 6 y 20 caracteres.")
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe contener al menos una letra mayúscula")
    .matches(/[a-z]/)
    .withMessage("La contraseña debe contener al menos una letra minúscula")
    .matches(/[0-9]/)
    .withMessage("La contraseña debe contener al menos un número")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("La contraseña debe contener al menos un símbolo"),
  (req: Request, res: Response, next: NextFunction) => {
    validateResult(req, res, next);
  },
];

// Validation para registrarse
export const register_user = [
  body("name").notEmpty().withMessage("El campo de nombre es obligatorio.."),
  body("lastname").notEmpty().withMessage("El campo apellido es obligatorio."),
  body("username")
    .notEmpty()
    .withMessage("El campo de nombre de usuario es obligatorio."),
  body("password")
    .notEmpty()
    .withMessage("El campo de contraseña es obligatorio.")
    .isLength({ min: 6, max: 20 })
    .withMessage("La contraseña debe tener entre 6 y 20 caracteres.")
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe contener al menos una letra mayúscula")
    .matches(/[a-z]/)
    .withMessage("La contraseña debe contener al menos una letra minúscula")
    .matches(/[0-9]/)
    .withMessage("La contraseña debe contener al menos un número")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("La contraseña debe contener al menos un símbolo"),
  (req: Request, res: Response, next: NextFunction) => {
    validateResult(req, res, next);
  },
];

export const verify2FA = [
  body("loginSecret")
    .notEmpty()
    .withMessage("El campo de loginSecret es obligatorio."),
  body("token").notEmpty().withMessage("El campo de token es obligatorio."),
  (req: Request, res: Response, next: NextFunction) => {
    validateResult(req, res, next);
  },
];

export const enable2FAValid = [
  body("token").notEmpty().withMessage("El campo de token es obligatorio."),
  (req: Request, res: Response, next: NextFunction) => {
    validateResult(req, res, next);
  },
];

export const disable2FAValid = [
  body("id").notEmpty().withMessage("El campo de id es obligatorio."),
  (req: Request, res: Response, next: NextFunction) => {
    validateResult(req, res, next);
  },
];

export const updateInfoUser = [
  body("name").notEmpty().withMessage("El campo de nombre es obligatorio.."),
  body("lastname").notEmpty().withMessage("El campo apellido es obligatorio."),
  (req: Request, res: Response, next: NextFunction) => {
    validateResult(req, res, next);
  },
];

export const updatePasswordUser = [
  body("passwordActual")
    .notEmpty()
    .withMessage("El campo de contraseña es obligatorio.")
    .isLength({ min: 6, max: 20 })
    .withMessage("La contraseña debe tener entre 6 y 20 caracteres.")
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe contener al menos una letra mayúscula")
    .matches(/[a-z]/)
    .withMessage("La contraseña debe contener al menos una letra minúscula")
    .matches(/[0-9]/)
    .withMessage("La contraseña debe contener al menos un número")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("La contraseña debe contener al menos un símbolo"),
  body("newPassword")
    .notEmpty()
    .withMessage("El campo de contraseña es obligatorio.")
    .isLength({ min: 6, max: 20 })
    .withMessage("La contraseña debe tener entre 6 y 20 caracteres.")
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe contener al menos una letra mayúscula")
    .matches(/[a-z]/)
    .withMessage("La contraseña debe contener al menos una letra minúscula")
    .matches(/[0-9]/)
    .withMessage("La contraseña debe contener al menos un número")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("La contraseña debe contener al menos un símbolo"),
  body("confirmNewPassword")
    .notEmpty()
    .withMessage("El campo de contraseña es obligatorio.")
    .isLength({ min: 6, max: 20 })
    .withMessage("La contraseña debe tener entre 6 y 20 caracteres.")
    .matches(/[A-Z]/)
    .withMessage("La contraseña debe contener al menos una letra mayúscula")
    .matches(/[a-z]/)
    .withMessage("La contraseña debe contener al menos una letra minúscula")
    .matches(/[0-9]/)
    .withMessage("La contraseña debe contener al menos un número")
    .matches(/[!@#$%^&*(),.?":{}|<>]/)
    .withMessage("La contraseña debe contener al menos un símbolo"),
  (req: Request, res: Response, next: NextFunction) => {
    validateResult(req, res, next);
  },
];
