import { BadRequestException } from "../common/exceptions/BadRequestException";
import { InternalServerErrorException } from "../common/exceptions/InternalServerErrorException";
import {
  UpdateUserDto,
  UserInfoUpdateDto,
  UserUpdatePasswordDto,
} from "../dtos/user.dto";
import { UserRepository } from "../repositories/user.repository";
import { comparePassword, hashPassword } from "../utils/password.functions";

export class UserService {
  private repo = new UserRepository();

  async updateUser(id: string, data: UserInfoUpdateDto): Promise<string> {
    try {
      const user = await this.repo.getUserById(id);

      if (!user) {
        throw new BadRequestException("El usuario no existe");
      }

      const userUpdated: UpdateUserDto = {
        name: data.name,
        lastname: data.lastname,
        username: user.username,
        password: user.password,
        is_2fa_enabled: user.is_2fa_enabled,
        twofa_secret: user.twofa_secret,
        twofa_temp_secret: user.twofa_temp_secret,
        login_secret: user.login_secret,
      };

      const result = await this.repo.updateUser(user.id, userUpdated);

      if (!result) {
        throw new InternalServerErrorException("No se pudo activar el 2FA");
      }

      return "Usuario actualizado exitosamente";
    } catch (error) {
      throw error;
    }
  }

  async updatePasswordUser(
    id: string,
    data: UserUpdatePasswordDto
  ): Promise<string> {
    try {
      const user = await this.repo.getUserById(id);

      if (!user) {
        throw new BadRequestException("El usuario no existe");
      }

      const isMatch = await comparePassword(
        data.passwordActual,
        user.password!
      );

      if (!isMatch) {
        throw new BadRequestException("La contraseña es incorrecta");
      }

      if (data.newPassword !== data.confirmNewPassword) {
        throw new BadRequestException("Las contraseñas no coinciden");
      }

      const password = await hashPassword(data.newPassword);

      const userUpdated: UpdateUserDto = {
        name: user.name,
        lastname: user.lastname,
        username: user.username,
        password: password,
        is_2fa_enabled: user.is_2fa_enabled,
        twofa_secret: user.twofa_secret,
        twofa_temp_secret: user.twofa_temp_secret,
        login_secret: user.login_secret,
      };

      const result = await this.repo.updateUser(user.id, userUpdated);

      if (!result) {
        throw new InternalServerErrorException("No se pudo activar el 2FA");
      }

      return "Contraseña actualizada exitosamente";
    } catch (error) {
      throw error;
    }
  }
}
