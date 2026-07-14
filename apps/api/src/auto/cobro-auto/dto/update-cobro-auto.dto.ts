import { PartialType } from '@nestjs/mapped-types';
import { CreateCobroAutoDto } from './create-cobro-auto.dto';

export class UpdateCobroAutoDto extends PartialType(CreateCobroAutoDto) {}
