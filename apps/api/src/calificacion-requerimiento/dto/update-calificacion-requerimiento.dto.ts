import { PartialType } from '@nestjs/mapped-types';
import { CreateCalificacionRequerimientoDto } from './create-calificacion-requerimiento.dto';

export class UpdateCalificacionRequerimientoDto extends PartialType(
  CreateCalificacionRequerimientoDto,
) {}
