import { IsString, MinLength } from 'class-validator';

export class CambiarPasswordDto {
  @IsString()
  passwordActual: string;

  @IsString()
  @MinLength(8)
  passwordNueva: string;
}
