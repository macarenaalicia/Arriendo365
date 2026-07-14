import { EstadoPropiedad, TipoPropiedad } from '@prisma/client';
export declare class CreatePropiedadDto {
    rol: string;
    calle: string;
    numero: string;
    sector?: string;
    ciudad: string;
    region: string;
    tipo: TipoPropiedad;
    nHabitaciones: number;
    nBanos: number;
    bodega?: boolean;
    bodegaNumero?: string;
    estacionamiento?: boolean;
    estacionamientoNumero?: string;
    mt2Totales: number;
    mt2Construidos: number;
    descripcion?: string;
    estado?: EstadoPropiedad;
    pagaContribuciones?: boolean;
}
