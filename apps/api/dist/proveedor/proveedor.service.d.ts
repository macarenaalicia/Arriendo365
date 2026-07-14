import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';
export declare class ProveedorService {
    private readonly prisma;
    private readonly tenant;
    constructor(prisma: PrismaService, tenant: TenantContextService);
    private assertPropiedadEnOrganizacion;
    create(propiedadId: string, dto: CreateProveedorDto): Promise<{
        id: string;
        tipo: import("@prisma/client").$Enums.TipoProveedor;
        estado: import("@prisma/client").$Enums.EstadoProveedor;
        nCliente: string;
        propiedadId: string;
    }>;
    findAll(propiedadId: string): Promise<{
        id: string;
        tipo: import("@prisma/client").$Enums.TipoProveedor;
        estado: import("@prisma/client").$Enums.EstadoProveedor;
        nCliente: string;
        propiedadId: string;
    }[]>;
    findOne(propiedadId: string, id: string): Promise<{
        id: string;
        tipo: import("@prisma/client").$Enums.TipoProveedor;
        estado: import("@prisma/client").$Enums.EstadoProveedor;
        nCliente: string;
        propiedadId: string;
    }>;
    update(propiedadId: string, id: string, dto: UpdateProveedorDto): Promise<{
        id: string;
        tipo: import("@prisma/client").$Enums.TipoProveedor;
        estado: import("@prisma/client").$Enums.EstadoProveedor;
        nCliente: string;
        propiedadId: string;
    }>;
    remove(propiedadId: string, id: string): Promise<void>;
}
