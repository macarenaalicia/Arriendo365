import { IsEnum, IsIn, IsOptional, IsUUID } from 'class-validator';
import { EstadoPago } from '@prisma/client';
import { ARRIENDO_TIPOS, type ArriendoTipo } from './create-pago.dto';

export class FindPagosDto {
  @IsOptional()
  @IsIn(ARRIENDO_TIPOS)
  arriendoTipo?: ArriendoTipo;

  @IsOptional()
  @IsUUID()
  arriendoId?: string;

  @IsOptional()
  @IsEnum(EstadoPago)
  estado?: EstadoPago;
}
