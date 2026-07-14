import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CreateArriendoPropiedadDto } from './dto/create-arriendo-propiedad.dto';
import { UpdateArriendoPropiedadDto } from './dto/update-arriendo-propiedad.dto';
import { FindArriendosPropiedadDto } from './dto/find-arriendos-propiedad.dto';

const DETALLE_INCLUDE = {
  propiedad: true,
  arrendatario: true,
  codeudor: true,
} as const;

@Injectable()
export class ArriendoPropiedadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  private async assertPropiedadEnOrganizacion(propiedadId: string) {
    const propiedad = await this.prisma.propiedad.findFirst({
      where: { id: propiedadId, organizacionId: this.tenant.organizacionId },
    });
    if (!propiedad) {
      throw new NotFoundException('Propiedad no encontrada');
    }
  }

  private async assertPersonaEnOrganizacion(personaId: string) {
    const persona = await this.prisma.persona.findFirst({
      where: { id: personaId, organizacionId: this.tenant.organizacionId },
    });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }
  }

  async create(dto: CreateArriendoPropiedadDto) {
    await this.assertPropiedadEnOrganizacion(dto.propiedadId);
    await this.assertPersonaEnOrganizacion(dto.arrendatarioId);
    if (dto.codeudorId) {
      await this.assertPersonaEnOrganizacion(dto.codeudorId);
    }

    return this.prisma.arriendoPropiedad.create({
      data: dto,
      include: DETALLE_INCLUDE,
    });
  }

  findAll(query: FindArriendosPropiedadDto) {
    return this.prisma.arriendoPropiedad.findMany({
      where: {
        propiedad: { organizacionId: this.tenant.organizacionId },
        estado: query.estado,
      },
      include: DETALLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const arriendo = await this.prisma.arriendoPropiedad.findFirst({
      where: { id, propiedad: { organizacionId: this.tenant.organizacionId } },
      include: { ...DETALLE_INCLUDE, inventario: true, requerimientos: true },
    });

    if (!arriendo) {
      throw new NotFoundException('Arriendo no encontrado');
    }

    return arriendo;
  }

  async update(id: string, dto: UpdateArriendoPropiedadDto) {
    await this.findOne(id);

    if (dto.propiedadId) {
      await this.assertPropiedadEnOrganizacion(dto.propiedadId);
    }
    if (dto.arrendatarioId) {
      await this.assertPersonaEnOrganizacion(dto.arrendatarioId);
    }
    if (dto.codeudorId) {
      await this.assertPersonaEnOrganizacion(dto.codeudorId);
    }

    return this.prisma.arriendoPropiedad.update({
      where: { id },
      data: dto,
      include: DETALLE_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.arriendoPropiedad.delete({ where: { id } });
  }
}
