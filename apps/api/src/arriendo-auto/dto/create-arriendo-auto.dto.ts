import { IsEnum, IsInt, IsOptional, IsString, IsUUID, Min } from 'class-validator';
import { EstadoArriendo } from '@prisma/client';

export class CreateArriendoAutoDto {
  @IsUUID()
  autoId: string;

  @IsUUID()
  arrendatarioId: string;

  @IsInt()
  @Min(0)
  kilometrajeEntrega: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  kilometrajeRecepcion?: number;

  @IsOptional()
  @IsString()
  contratoDocId?: string;

  @IsOptional()
  @IsEnum(EstadoArriendo)
  estado?: EstadoArriendo;
}
