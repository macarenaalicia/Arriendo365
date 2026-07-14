import { IsNumber, IsOptional, IsString, Min } from 'class-validator';

export class CreateGastoDto {
  @IsOptional()
  @IsString()
  fotoBoletaId?: string;

  @IsNumber()
  @Min(0)
  valor: number;

  @IsOptional()
  @IsString()
  detalle?: string;
}
