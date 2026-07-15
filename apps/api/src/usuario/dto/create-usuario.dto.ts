import { IsEnum, IsUUID, MinLength } from 'class-validator';
import { RolUsuario } from '@prisma/client';

export class CreateUsuarioDto {
  @IsUUID()
  personaId: string;

  @IsEnum(RolUsuario)
  rol: RolUsuario;

  @MinLength(8)
  password: string;
}
