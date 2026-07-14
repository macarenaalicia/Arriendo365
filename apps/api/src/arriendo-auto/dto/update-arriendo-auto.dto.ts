import { PartialType } from '@nestjs/mapped-types';
import { CreateArriendoAutoDto } from './create-arriendo-auto.dto';

export class UpdateArriendoAutoDto extends PartialType(CreateArriendoAutoDto) {}
