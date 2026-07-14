import { PartialType } from '@nestjs/mapped-types';
import { CreateArriendoPropiedadDto } from './create-arriendo-propiedad.dto';

export class UpdateArriendoPropiedadDto extends PartialType(CreateArriendoPropiedadDto) {}
