import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
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
  numeroHabitacion?: string;

  // Requerido cuando tipo = HABITACION o LOFT (se valida en el servicio,
  // donde además se confirma que la propiedad madre exista en la
  // organización y no sea a su vez una pieza).
  @IsOptional()
  @IsUUID()
  propiedadPadreId?: string;

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

  @IsOptional()
  @IsNumber()
  @Min(0)
  precioArriendoEsperado?: number;

  @IsOptional()
  @IsString()
  fojasInscripcion?: string;

  @IsOptional()
  @IsString()
  numeroInscripcion?: string;

  @IsOptional()
  @IsInt()
  anioInscripcion?: number;
}
