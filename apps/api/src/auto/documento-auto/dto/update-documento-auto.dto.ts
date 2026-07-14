import { PartialType } from '@nestjs/mapped-types';
import { CreateDocumentoAutoDto } from './create-documento-auto.dto';

export class UpdateDocumentoAutoDto extends PartialType(CreateDocumentoAutoDto) {}
