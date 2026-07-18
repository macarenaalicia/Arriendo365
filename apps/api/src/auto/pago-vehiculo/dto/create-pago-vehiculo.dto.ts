import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { EstadoPago, Periodicidad, TipoPagoVehiculo } from '@prisma/client';

export class CreatePagoVehiculoDto {
  @IsEnum(TipoPagoVehiculo)
  tipo: TipoPagoVehiculo;

  @IsOptional()
  @IsString()
  autopista?: string;

  @IsOptional()
  @IsString()
  numeroBoleta?: string;

  @IsEnum(Periodicidad)
  periodicidad: Periodicidad;

  @IsOptional()
  @IsBoolean()
  conCredito?: boolean;

  @IsOptional()
  @IsInt()
  @Min(1)
  cuotas?: number;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoCuota?: number;

  @IsNumber()
  @Min(0)
  monto: number;

  @Type(() => Date)
  @IsDate()
  fechaPago: Date;

  @IsOptional()
  @IsString()
  comprobanteFotoId?: string;

  @IsOptional()
  @IsBoolean()
  pagado?: boolean;

  @IsOptional()
  @IsNumber()
  @Min(0)
  montoPagado?: number;

  @IsOptional()
  @IsBoolean()
  esAbono?: boolean;

  @IsOptional()
  @IsUUID()
  abonoId?: string;

  @IsOptional()
  @IsEnum(EstadoPago)
  estado?: EstadoPago;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaPagoReal?: Date;
}
