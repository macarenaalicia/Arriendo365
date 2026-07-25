import { Type } from 'class-transformer';
import { IsDate, IsEnum, IsNumber, IsOptional, IsString, IsUUID } from 'class-validator';
import { EstadoRequerimiento, UrgenciaRequerimiento } from '@prisma/client';

export class UpdateRequerimientoDto {
  @IsOptional()
  @IsUUID()
  arriendoPropiedadId?: string;

  @IsOptional()
  @IsEnum(UrgenciaRequerimiento)
  urgencia?: UrgenciaRequerimiento;

  @IsOptional()
  @IsEnum(EstadoRequerimiento)
  estado?: EstadoRequerimiento;

  @IsOptional()
  @IsUUID()
  calificacionId?: string;

  @IsOptional()
  @IsUUID()
  tecnicoId?: string;

  @IsOptional()
  @IsString()
  notasArrendatario?: string;

  @IsOptional()
  @IsString()
  notasInternas?: string;

  @IsOptional()
  @IsString()
  detalleResolucion?: string;

  // Solo propietario/administrador pueden informar estos campos.
  @IsOptional()
  @IsString()
  inspeccion?: string;

  @IsOptional()
  @IsString()
  detalleGasto?: string;

  @IsOptional()
  @IsNumber()
  totalGasto?: number;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaComprometida?: Date;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaSolucion?: Date;

  @IsOptional()
  @IsString()
  notaActualizacion?: string;
}
