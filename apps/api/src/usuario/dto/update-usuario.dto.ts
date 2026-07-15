import { IsBoolean, IsEnum, IsOptional, MinLength } from 'class-validator';
import { RolUsuario } from '@prisma/client';

export class UpdateUsuarioDto {
  @IsOptional()
  @IsEnum(RolUsuario)
  rol?: RolUsuario;

  @IsOptional()
  @IsBoolean()
  activo?: boolean;

  @IsOptional()
  @MinLength(8)
  password?: string;
}
