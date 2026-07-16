import { IsEmail, IsOptional, IsString } from 'class-validator';

export class ActualizarPerfilDto {
  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  telefono?: string;
}
