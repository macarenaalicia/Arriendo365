import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';
import { TipoCuentaBancaria } from '@prisma/client';

export class CreateCuentaBancariaDto {
  @IsString()
  @MinLength(1)
  alias: string;

  @IsString()
  @MinLength(1)
  banco: string;

  @IsEnum(TipoCuentaBancaria)
  tipoCuenta: TipoCuentaBancaria;

  @IsString()
  @MinLength(1)
  numero: string;

  @IsString()
  @MinLength(1)
  titular: string;

  @IsString()
  @MinLength(1)
  rut: string;

  @IsOptional()
  @IsEmail()
  email?: string;
}
