import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export class LoginDto {
  @IsEmail()
  email: string;

  // Sin @MinLength acá: login solo verifica credenciales, no define la
  // política de contraseñas — la de 8 caracteres se aplica al crearlas o
  // cambiarlas (ver create/update-usuario.dto, cambiar-password.dto). La
  // contraseña provisoria "1234" tiene 4 caracteres y debe poder usarse
  // para el primer inicio de sesión.
  @IsString()
  @IsNotEmpty()
  password: string;
}
