import { Injectable } from '@nestjs/common';
import { ClsService, ClsStore } from 'nestjs-cls';
import { RolUsuario } from '@prisma/client';

export interface TenantClsStore extends ClsStore {
  organizacionId: string;
  usuarioId: string;
  personaId: string;
  rol: RolUsuario;
  esSuperAdmin: boolean;
}

@Injectable()
export class TenantContextService {
  constructor(private readonly cls: ClsService<TenantClsStore>) {}

  set(store: TenantClsStore) {
    this.cls.set('organizacionId', store.organizacionId);
    this.cls.set('usuarioId', store.usuarioId);
    this.cls.set('personaId', store.personaId);
    this.cls.set('rol', store.rol);
    this.cls.set('esSuperAdmin', store.esSuperAdmin);
  }

  get organizacionId(): string {
    return this.cls.get('organizacionId');
  }

  get usuarioId(): string {
    return this.cls.get('usuarioId');
  }

  get personaId(): string {
    return this.cls.get('personaId');
  }

  get rol(): RolUsuario {
    return this.cls.get('rol');
  }

  get esArrendatario(): boolean {
    return this.rol === RolUsuario.ARRENDATARIO;
  }

  get esSuperAdmin(): boolean {
    return this.cls.get('esSuperAdmin') === true;
  }
}
