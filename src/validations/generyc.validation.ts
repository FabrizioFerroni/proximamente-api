import { query } from "express-validator";
import { Request, Response, NextFunction } from "express";
import validateResult from "../helpers/validation.helper";

export const paginationDtoV = [
  query("page")
    .optional()
    .isNumeric()
    .withMessage("El campo de page debe ser numerico.")
    .custom((value) => {
      if (!Number.isInteger(+value) || +value <= 0) {
        throw new Error("El número debe ser un entero positivo");
      }
      return true;
    }),
  query("limit")
    .optional()
    .isNumeric()
    .withMessage("El campo de limit debe ser numerico.")
    .isInt()
    .withMessage("El campo de limit debe ser un entero.")
    .custom((value) => {
      if (!Number.isInteger(+value) || +value <= 0) {
        throw new Error("El número debe ser un entero positivo");
      }
      return true;
    }),
  (req: Request, res: Response, next: NextFunction) => {
    validateResult(req, res, next);
  },
];
