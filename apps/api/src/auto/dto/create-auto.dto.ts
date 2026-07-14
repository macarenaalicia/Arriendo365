import { IsEnum, IsInt, IsOptional, IsString, Min } from 'class-validator';
import { EstadoAuto } from '@prisma/client';

export class CreateAutoDto {
  @IsString()
  patente: string;

  @IsInt()
  @Min(0)
  kilometraje: number;

  @IsOptional()
  @IsString()
  padronDocId?: string;

  @IsOptional()
  @IsEnum(EstadoAuto)
  estado?: EstadoAuto;
}
