import { Type } from 'class-transformer';
import { ArrayMinSize, IsArray, IsDate, IsInt, IsOptional, IsUUID, Min } from 'class-validator';

export class CreateMantencionAutoDto {
  @IsArray()
  @ArrayMinSize(1)
  @IsUUID(undefined, { each: true })
  configuracionIds: string[];

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
