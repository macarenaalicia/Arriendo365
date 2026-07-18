import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsUUID,
  Min,
} from 'class-validator';
import { EstadoPago, QuienPago } from '@prisma/client';

export class CreateMantencionAutoDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  configuracionIds: string[];

  @IsInt()
  @Min(0)
  kilometrajeActual: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  kilometrajeProxima?: number;

  @Type(() => Date)
  @IsDate()
  fechaMantencion: Date;

  @IsOptional()
  @IsNumber()
  @Min(0)
  costo?: number;

  @IsOptional()
  @IsEnum(QuienPago)
  quienPago?: QuienPago;

  @IsOptional()
  @IsEnum(EstadoPago)
  estadoPago?: EstadoPago;
}
