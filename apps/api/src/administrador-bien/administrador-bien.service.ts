import { ConflictException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { AsignarBienesDto } from './dto/asignar-bienes.dto';

/** null = sin restricción (ve todos los bienes de la organización, como hoy). */
export interface FiltroBienes {
  propiedadIds: string[] | null;
  autoIds: string[] | null;
}

@Injectable()
export class AdministradorBienService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  private async assertUsuarioAdministrador(usuarioId: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id: usuarioId, organizacionId: this.tenant.organizacionId },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    if (usuario.rol !== 'ADMINISTRADOR') {
      throw new ConflictException('Solo se puede acotar a bienes puntuales a un usuario ADMINISTRADOR');
    }
    return usuario;
  }

  /**
   * Personas/Usuarios abarcan a toda la organización — un administrador
   * acotado a bienes puntuales no debe verlos ni gestionarlos, aunque sí
   * pueda seguir viendo la lista de personas para elegir arrendatario/
   * codeudor al crear un arriendo dentro de sus propios bienes.
   */
  async assertAccesoCompleto() {
    const { propiedadIds, autoIds } = await this.getFiltroBienesUsuarioActual();
    if (propiedadIds !== null || autoIds !== null) {
      throw new ForbiddenException('No tienes acceso a esta sección');
    }
  }

  async listarPorUsuario(usuarioId: string) {
    await this.assertAccesoCompleto();
    await this.assertUsuarioAdministrador(usuarioId);
    const filas = await this.prisma.administradorBien.findMany({ where: { usuarioId } });
    return {
      propiedadIds: filas.filter((f) => f.propiedadId).map((f) => f.propiedadId as string),
      autoIds: filas.filter((f) => f.autoId).map((f) => f.autoId as string),
    };
  }

  async asignar(usuarioId: string, dto: AsignarBienesDto) {
    await this.assertAccesoCompleto();
    await this.assertUsuarioAdministrador(usuarioId);

    await this.prisma.$transaction([
      this.prisma.administradorBien.deleteMany({ where: { usuarioId } }),
      this.prisma.administradorBien.createMany({
        data: [
          ...dto.propiedadIds.map((propiedadId) => ({ usuarioId, propiedadId })),
          ...dto.autoIds.map((autoId) => ({ usuarioId, autoId })),
        ],
      }),
    ]);

    return this.listarPorUsuario(usuarioId);
  }

  /**
   * Devuelve el filtro de bienes aplicable al usuario autenticado actual.
   * Si no tiene filas en administrador_bien, no está acotado (ve todo).
   */
  async getFiltroBienesUsuarioActual(): Promise<FiltroBienes> {
    if (this.tenant.rol !== 'ADMINISTRADOR') {
      return { propiedadIds: null, autoIds: null };
    }

    const filas = await this.prisma.administradorBien.findMany({
      where: { usuarioId: this.tenant.usuarioId },
    });
    if (filas.length === 0) {
      return { propiedadIds: null, autoIds: null };
    }

    return {
      propiedadIds: filas.filter((f) => f.propiedadId).map((f) => f.propiedadId as string),
      autoIds: filas.filter((f) => f.autoId).map((f) => f.autoId as string),
    };
  }
}
