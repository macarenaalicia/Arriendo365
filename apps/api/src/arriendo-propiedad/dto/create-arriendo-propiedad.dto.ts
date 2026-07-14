import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoArriendo } from '@prisma/client';

export class CreateArriendoPropiedadDto {
  @IsUUID()
  propiedadId: string;

  @IsUUID()
  arrendatarioId: string;

  @IsOptional()
  @IsUUID()
  codeudorId?: string;

  @IsInt()
  @Min(1)
  @Max(31)
  fechaPago: number;

  @Type(() => Date)
  @IsDate()
  fechaEntrega: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaRecepcion?: Date;

  @IsString()
  periodoAlza: string;

  @IsOptional()
  @IsBoolean()
  garantia?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  garantiaMontoPactado?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  garantiaMontoPagado?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  garantiaFechaDevolucion?: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  garantiaMontoDevuelto?: number;

  @IsOptional()
  @IsString()
  garantiaMotivoRetencion?: string;

  @IsNumber()
  @Min(0)
  montoArriendo: number;

  @IsOptional()
  @IsString()
  actaEntregaDetalle?: string;

  @IsOptional()
  @IsString()
  actaRecepcionDetalle?: string;

  @IsOptional()
  @IsEnum(EstadoArriendo)
  estado?: EstadoArriendo;
}
