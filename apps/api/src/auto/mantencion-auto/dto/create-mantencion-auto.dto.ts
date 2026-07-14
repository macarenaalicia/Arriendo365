import { Type } from 'class-transformer';
import { IsDate, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateMantencionAutoDto {
  @IsUUID()
  configuracionId: string;

  @IsInt()
  @Min(0)
  kilometrajeActual: number;

  @IsOptional()
  @IsInt()
  @Min(0)
  kilometrajeProxima?: number;

  @Type(() => Date)
  @IsDate()
  fechaMantencion: Date;
}
