import { IsEmail, IsNotEmpty, IsString, MinLength } from 'class-validator';

export class RegistroOrganizacionDto {
  @IsString()
  @IsNotEmpty()
  nombreOrganizacion: string;

  @IsString()
  @IsNotEmpty()
  nombreCompleto: string;

  @IsString()
  @IsNotEmpty()
  rut: string;

  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;
}
