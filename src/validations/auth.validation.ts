import { body } from "express-validator";
import { Request, Response, NextFunction } from "express";
import validateResult from "../helpers/validation.helper";

export const refresh_token = [
  body("oldToken")
    .notEmpty()
    .withMessage("El campo de oldToken es obligatorio."),
  (req: Request, res: Response, next: NextFunction) => {
    validateResult(req, res, next);
  },
];
