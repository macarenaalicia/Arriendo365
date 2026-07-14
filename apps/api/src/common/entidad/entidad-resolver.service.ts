import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';

export const ENTIDAD_TIPOS = [
  'propiedad',
  'persona',
  'auto',
  'arriendo_propiedad',
  'arriendo_auto',
  'requerimiento',
] as const;

export type EntidadTipo = (typeof ENTIDAD_TIPOS)[number];

@Injectable()
export class EntidadResolverService {
  constructor(private readonly prisma: PrismaService) {}

  async assertEntidadEnOrganizacion(
    entidadTipo: EntidadTipo,
    entidadId: string,
    organizacionId: string,
  ) {
    const existe = await this.entidadExisteEnOrganizacion(entidadTipo, entidadId, organizacionId);
    if (!existe) {
      throw new NotFoundException(`${entidadTipo} no encontrada`);
    }
  }

  private entidadExisteEnOrganizacion(
    entidadTipo: EntidadTipo,
    entidadId: string,
    organizacionId: string,
  ): Promise<unknown> {
    switch (entidadTipo) {
      case 'propiedad':
        return this.prisma.propiedad.findFirst({ where: { id: entidadId, organizacionId } });
      case 'persona':
        return this.prisma.persona.findFirst({ where: { id: entidadId, organizacionId } });
      case 'auto':
        return this.prisma.auto.findFirst({ where: { id: entidadId, organizacionId } });
      case 'arriendo_propiedad':
        return this.prisma.arriendoPropiedad.findFirst({
          where: { id: entidadId, propiedad: { organizacionId } },
        });
      case 'arriendo_auto':
        return this.prisma.arriendoAuto.findFirst({
          where: { id: entidadId, auto: { organizacionId } },
        });
      case 'requerimiento':
        return this.prisma.requerimiento.findFirst({
          where: { id: entidadId, arriendoPropiedad: { propiedad: { organizacionId } } },
        });
    }
  }
}
