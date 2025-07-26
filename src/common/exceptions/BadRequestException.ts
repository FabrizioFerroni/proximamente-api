import { HttpException } from "./HttpException";

export class BadRequestException extends HttpException {
  constructor(message = "Solicitud inválida") {
    super(400, message);
  }
}
