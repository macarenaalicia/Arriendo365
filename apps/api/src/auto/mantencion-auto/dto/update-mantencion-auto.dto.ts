import { PartialType } from '@nestjs/mapped-types';
import { CreateMantencionAutoDto } from './create-mantencion-auto.dto';

export class UpdateMantencionAutoDto extends PartialType(CreateMantencionAutoDto) {}
