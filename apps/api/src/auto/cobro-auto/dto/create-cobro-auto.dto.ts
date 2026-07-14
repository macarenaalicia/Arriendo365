import { IsEnum, IsNumber, IsOptional, IsString, Min } from 'class-validator';
import { QuienPago, TipoCobroAuto } from '@prisma/client';

export class CreateCobroAutoDto {
  @IsEnum(TipoCobroAuto)
  tipo: TipoCobroAuto;

  @IsEnum(QuienPago)
  responsable: QuienPago;

  @IsOptional()
  @IsEnum(QuienPago)
  quienReparo?: QuienPago;

  @IsNumber()
  @Min(0)
  valor: number;

  @IsOptional()
  @IsString()
  detalle?: string;
}
