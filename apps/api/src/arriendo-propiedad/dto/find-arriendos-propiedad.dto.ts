import { IsEnum, IsOptional } from 'class-validator';
import { EstadoArriendo } from '@prisma/client';

export class FindArriendosPropiedadDto {
  @IsOptional()
  @IsEnum(EstadoArriendo)
  estado?: EstadoArriendo;
}
