import { RolUsuario } from '@prisma/client';
export declare const ROLES_KEY = "roles";
export declare const Roles: (...roles: RolUsuario[]) => import("@nestjs/common").CustomDecorator<string>;
