import { IsNumber, IsString, Min } from 'class-validator';

export class CreateRequerimientoPresupuestoDto {
  @IsString()
  fotoId: string;

  @IsNumber()
  @Min(0)
  valor: number;
}
