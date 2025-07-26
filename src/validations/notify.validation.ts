import { body } from "express-validator";
import { Request, Response, NextFunction } from "express";
import validateResult from "../helpers/validation.helper";

export const create_new_notification = [
  body("name").notEmpty().withMessage("El campo de nombre es obligatorio."),
  body("email")
    .notEmpty()
    .withMessage("El campo de correo electrónico es obligatorio.")
    .isEmail()
    .withMessage(
      "El campo de correo electrónico debe ser una dirección de correo electrónico válida."
    ),
  (req: Request, res: Response, next: NextFunction) => {
    validateResult(req, res, next);
  },
];
