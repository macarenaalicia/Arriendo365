import { PartialType } from '@nestjs/mapped-types';
import { IsBoolean, IsIn, IsOptional, IsString } from 'class-validator';
import { EstadoPago } from '@prisma/client';
import { CreateMantencionAutoDto } from './create-mantencion-auto.dto';

export class UpdateMantencionAutoDto extends PartialType(CreateMantencionAutoDto) {
  @IsOptional()
  @IsIn(['PENDIENTE', 'PAGADO', 'ATRASADO', 'RECHAZADO'])
  estadoPago?: EstadoPago;

  @IsOptional()
  @IsBoolean()
  aprobado?: boolean;

  @IsOptional()
  @IsString()
  motivoRechazo?: string;
}
