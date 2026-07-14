import { IsEnum, IsOptional, IsString } from 'class-validator';
import { EstadoProveedor, TipoProveedor } from '@prisma/client';

export class CreateProveedorDto {
  @IsEnum(TipoProveedor)
  tipo: TipoProveedor;

  @IsString()
  empresa: string;

  @IsString()
  nCliente: string;

  @IsOptional()
  @IsEnum(EstadoProveedor)
  estado?: EstadoProveedor;
}
