import { Type } from 'class-transformer';
import { IsBoolean, IsDate, IsEnum, IsInt, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { Periodicidad, TipoPagoVehiculo } from '@prisma/client';

export class CreatePagoVehiculoDto {
  @IsEnum(TipoPagoVehiculo)
  tipo: TipoPagoVehiculo;

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
}
