import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EstadoArriendo } from '@prisma/client';

export class FindArriendosAutoDto {
  @IsOptional()
  @IsEnum(EstadoArriendo)
  estado?: EstadoArriendo;

  @IsOptional()
  @IsUUID()
  autoId?: string;
}
