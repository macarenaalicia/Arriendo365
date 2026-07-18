import {
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { Type } from 'class-transformer';
import { EstadoArriendo, PeriodoPagoAuto } from '@prisma/client';

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

  // A diferencia de propiedades (día fijo del mes), el arriendo de un auto
  // se paga con esta frecuencia.
  @IsEnum(PeriodoPagoAuto)
  periodoPago: PeriodoPagoAuto;

  @Type(() => Date)
  @IsDate()
  fechaEntrega: Date;

  @IsString()
  periodoAlza: string;

  @IsNumber()
  @Min(0)
  montoArriendo: number;

  @IsOptional()
  @IsEnum(EstadoArriendo)
  estado?: EstadoArriendo;
}
