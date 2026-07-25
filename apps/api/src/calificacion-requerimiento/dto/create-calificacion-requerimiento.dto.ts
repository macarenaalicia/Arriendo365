import { IsString } from 'class-validator';

export class CreateCalificacionRequerimientoDto {
  @IsString()
  nombre: string;
}
