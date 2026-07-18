import { Type } from 'class-transformer';
import {
  IsBoolean,
  IsDate,
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Min,
} from 'class-validator';
import { CategoriaPago, EstadoPago, TipoProveedor } from '@prisma/client';

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
  periodoHasta?: Date;

  @IsOptional()
  @IsInt()
  @Min(0)
  kilometraje?: number;

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
  @IsIn(['ARRIENDO', 'SERVICIOS_BASICOS', 'GARANTIA'])
  categoria?: CategoriaPago;

  @IsOptional()
  @IsIn(['AGUA', 'LUZ', 'GAS'])
  tipoServicio?: TipoProveedor;

  @IsOptional()
  @IsString()
  comprobanteFotoId?: string;

  @IsOptional()
  @IsBoolean()
  aprobado?: boolean;

  @IsOptional()
  @IsString()
  motivoRechazo?: string;
}
