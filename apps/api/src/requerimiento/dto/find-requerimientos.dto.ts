import { IsEnum, IsOptional, IsUUID } from 'class-validator';
import { EstadoRequerimiento, UrgenciaRequerimiento } from '@prisma/client';

export class FindRequerimientosDto {
  @IsOptional()
  @IsUUID()
  arriendoPropiedadId?: string;

  @IsOptional()
  @IsEnum(EstadoRequerimiento)
  estado?: EstadoRequerimiento;

  @IsOptional()
  @IsEnum(UrgenciaRequerimiento)
  urgencia?: UrgenciaRequerimiento;
}
