import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import { EstadoPropiedad, TipoPropiedad } from '@prisma/client';

export class CreatePropiedadDto {
  @IsString()
  rol: string;

  @IsString()
  calle: string;

  @IsString()
  numero: string;

  @IsOptional()
  @IsString()
  numeroDepartamento?: string;

  @IsOptional()
  @IsString()
  sector?: string;

  @IsString()
  ciudad: string;

  @IsString()
  region: string;

  @IsEnum(TipoPropiedad)
  tipo: TipoPropiedad;

  @IsInt()
  @Min(0)
  nHabitaciones: number;

  @IsInt()
  @Min(0)
  nBanos: number;

  @IsOptional()
  @IsBoolean()
  bodega?: boolean;

  @IsOptional()
  @IsString()
  bodegaNumero?: string;

  @IsOptional()
  @IsBoolean()
  estacionamiento?: boolean;

  @IsOptional()
  @IsString()
  estacionamientoNumero?: string;

  @IsNumber()
  @Min(0)
  mt2Totales: number;

  @IsNumber()
  @Min(0)
  mt2Construidos: number;

  @IsOptional()
  @IsString()
  descripcion?: string;

  @IsOptional()
  @IsEnum(EstadoPropiedad)
  estado?: EstadoPropiedad;

  @IsOptional()
  @IsBoolean()
  pagaContribuciones?: boolean;
}
