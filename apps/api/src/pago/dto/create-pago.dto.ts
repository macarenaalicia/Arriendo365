import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { EstadoPago } from '@prisma/client';

export const ARRIENDO_TIPOS = ['propiedad', 'auto'] as const;
export type ArriendoTipo = (typeof ARRIENDO_TIPOS)[number];

export class CreatePagoDto {
  @IsIn(ARRIENDO_TIPOS)
  arriendoTipo: ArriendoTipo;

  @IsUUID()
  arriendoId: string;

  @Type(() => Date)
  @IsDate()
  periodo: Date;

  @Type(() => Date)
  @IsDate()
  fechaComprometida: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaPagoReal?: Date;

  @IsNumber()
  @Min(0)
  monto: number;

  @IsOptional()
  @IsString()
  medioPago?: string;

  @IsOptional()
  @IsBoolean()
  esAbono?: boolean;

  @IsOptional()
  @IsIn(['PENDIENTE', 'PAGADO', 'ATRASADO', 'RECHAZADO'])
  estado?: EstadoPago;

  @IsOptional()
  @IsString()
  comprobanteFotoId?: string;

  @IsOptional()
  @IsBoolean()
  aprobado?: boolean;
}
