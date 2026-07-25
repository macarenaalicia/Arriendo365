import { IsArray, IsString } from 'class-validator';

export class AsignarBienesDto {
  @IsArray()
  @IsString({ each: true })
  propiedadIds: string[];

  @IsArray()
  @IsString({ each: true })
  autoIds: string[];
}
