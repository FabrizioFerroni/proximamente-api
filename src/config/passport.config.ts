import { UserRepository } from "../repositories/user.repository";
import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Strategy as JwtStrategy, ExtractJwt } from "passport-jwt";
import bcrypt from "bcryptjs";
import { UserResponseDto } from "../dtos/user.dto";
import { config } from "dotenv";
import { comparePassword } from "../utils/password.functions";
config();

const userRepository = new UserRepository();

passport.use(
  new LocalStrategy(
    {
      usernameField: "username",
      passwordField: "password",
    },
    async (username, password, done) => {
      try {
        const user = await userRepository.getUserByUsername(username);

        if (!user) {
          return done(null, false, {
            message: "Usuario no encontrado.",
          });
        }

        const isMatch = await comparePassword(password, user.password!);

        if (!isMatch) {
          return done(null, false, {
            message: "Nombre de usuario o contraseña incorrectos.",
          });
        }

        const body: UserResponseDto = {
          id: user.id,
          name: user.name,
          lastname: user.lastname,
          username: user.username,
          is_2fa_enabled: user.is_2fa_enabled,
          twofa_secret: user.twofa_secret,
          twofa_temp_secret: user.twofa_temp_secret,
        };
        return done(null, body);
      } catch (error) {
        return done(error);
      }
    }
  )
);

// 2. ESTRATEGIA JWT: Para proteger rutas
passport.use(
  new JwtStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_ACCESS_SECRET as string,
    },
    async (jwtPayload: any, done: any) => {
      try {
        const user = await userRepository.getUserById(jwtPayload.sub);

        if (user) {
          const { password, ...body } = user;
          return done(null, body as UserResponseDto);
        } else {
          return done(null, false);
        }
      } catch (error) {
        return done(error, false);
      }
    }
  )
);

export default passport;
