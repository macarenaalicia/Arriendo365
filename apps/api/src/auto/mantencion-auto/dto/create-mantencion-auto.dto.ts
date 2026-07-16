import { Type } from 'class-transformer';
import {
  ArrayMinSize,
  IsArray,
  IsDate,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';

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
  @IsString()
  medioPago?: string;
}
