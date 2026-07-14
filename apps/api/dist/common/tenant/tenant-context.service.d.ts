import { ClsService, ClsStore } from 'nestjs-cls';
import { RolUsuario } from '@prisma/client';
export interface TenantClsStore extends ClsStore {
    organizacionId: string;
    usuarioId: string;
    personaId: string;
    rol: RolUsuario;
}
export declare class TenantContextService {
    private readonly cls;
    constructor(cls: ClsService<TenantClsStore>);
    set(store: TenantClsStore): void;
    get organizacionId(): string;
    get usuarioId(): string;
    get personaId(): string;
    get rol(): RolUsuario;
}
