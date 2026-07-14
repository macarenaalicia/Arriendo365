import { PartialType } from '@nestjs/mapped-types';
import { CreateConfiguracionMantencionDto } from './create-configuracion-mantencion.dto';

export class UpdateConfiguracionMantencionDto extends PartialType(
  CreateConfiguracionMantencionDto,
) {}
