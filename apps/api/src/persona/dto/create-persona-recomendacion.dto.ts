import { IsString } from 'class-validator';

export class CreatePersonaRecomendacionDto {
  @IsString()
  nombreCompleto: string;

  @IsString()
  numeroContacto: string;
}
