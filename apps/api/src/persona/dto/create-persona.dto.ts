import { Type } from 'class-transformer';
import {
  IsArray,
  IsDate,
  IsEmail,
  IsOptional,
  IsString,
  ValidateNested,
} from 'class-validator';
import { CreatePersonaRecomendacionDto } from './create-persona-recomendacion.dto';

export class CreatePersonaDto {
  @IsString()
  nombreCompleto: string;

  @IsString()
  rut: string;

  @IsOptional()
  @Type(() => Date)
  @IsDate()
  fechaNacimiento?: Date;

  @IsOptional()
  @IsString()
  direccion?: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsOptional()
  @IsEmail()
  email?: string;

  @IsOptional()
  @IsString()
  dicom360DocId?: string;

  @IsOptional()
  @IsString()
  carnetFrontalFotoId?: string;

  @IsOptional()
  @IsString()
  carnetTraseraFotoId?: string;

  @IsOptional()
  @IsString()
  licenciaFrontalFotoId?: string;

  @IsOptional()
  @IsString()
  licenciaTraseraFotoId?: string;

  @IsOptional()
  @IsString()
  contratoTrabajoDocId?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreatePersonaRecomendacionDto)
  recomendaciones?: CreatePersonaRecomendacionDto[];
}
