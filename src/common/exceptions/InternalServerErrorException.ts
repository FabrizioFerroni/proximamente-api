import { HttpException } from "./HttpException";

export class InternalServerErrorException extends HttpException {
  constructor(message = "Error interno del servidor") {
    super(500, message);
  }
}
