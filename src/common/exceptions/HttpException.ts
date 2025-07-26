export class HttpException extends Error {
  constructor(public readonly statusCode: number, message: string) {
    super(message);
    this.name = new.target.name; // Guarda el nombre de la subclase
  }
}
