import { HttpException } from "./HttpException";

export class NotFoundException extends HttpException {
  constructor(message = "Solicitud no encontrada") {
    super(404, message);
  }
}
