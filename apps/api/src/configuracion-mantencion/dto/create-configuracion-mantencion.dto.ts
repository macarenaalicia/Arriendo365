import { IsInt, IsString, Min } from 'class-validator';

export class CreateConfiguracionMantencionDto {
  @IsString()
  tipo: string;

  @IsInt()
  @Min(1)
  cadaKm: number;
}
