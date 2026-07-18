import { IsEnum, IsInt, IsOptional, IsString, Max, Min } from 'class-validator';
import { EstadoAuto } from '@prisma/client';

export class CreateAutoDto {
  @IsString()
  patente: string;

  @IsOptional()
  @IsString()
  marca?: string;

  @IsOptional()
  @IsString()
  modelo?: string;

  @IsOptional()
  @IsInt()
  @Min(1900)
  @Max(2100)
  anio?: number;

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
