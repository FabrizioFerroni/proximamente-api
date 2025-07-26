import { validationResult } from "express-validator";
import { Request, Response, NextFunction } from "express";

const validateResult = (req: Request, res: Response, next: NextFunction) => {
  try {
    validationResult(req).throw();
    return next();
  } catch (err: any) {
    const cleanedErrors = Object.keys(err.errors).map((key) => {
      const cleanedError = { ...err.errors[key] };
      cleanedError.mensaje = cleanedError.msg;
      cleanedError.campo = cleanedError.path;
      cleanedError.location = cleanedError.location;
      delete cleanedError.path;
      delete cleanedError.msg;
      delete cleanedError.value;
      delete cleanedError.type;
      //delete cleanedError.location;
      return cleanedError;
    });
    res.status(400).send({ errors: cleanedErrors });
  }
};

export default validateResult;
