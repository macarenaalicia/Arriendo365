import { EstadoProveedor, TipoProveedor } from '@prisma/client';
export declare class CreateProveedorDto {
    tipo: TipoProveedor;
    nCliente: string;
    estado?: EstadoProveedor;
}
