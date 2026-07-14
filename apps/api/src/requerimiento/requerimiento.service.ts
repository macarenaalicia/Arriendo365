import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto';
import { UpdateRequerimientoDto } from './dto/update-requerimiento.dto';
import { FindRequerimientosDto } from './dto/find-requerimientos.dto';

const DETALLE_INCLUDE = {
  arriendoPropiedad: { include: { propiedad: true } },
  tecnico: true,
  presupuestos: true,
  gastos: true,
} as const;

@Injectable()
export class RequerimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  private async assertArriendoPropiedadEnOrganizacion(arriendoPropiedadId: string) {
    const arriendo = await this.prisma.arriendoPropiedad.findFirst({
      where: { id: arriendoPropiedadId, propiedad: { organizacionId: this.tenant.organizacionId } },
    });
    if (!arriendo) {
      throw new NotFoundException('Arriendo de propiedad no encontrado');
    }
  }

  private async assertPersonaEnOrganizacion(personaId: string) {
    const persona = await this.prisma.persona.findFirst({
      where: { id: personaId, organizacionId: this.tenant.organizacionId },
    });
    if (!persona) {
      throw new NotFoundException('Técnico no encontrado');
    }
  }

  async create(dto: CreateRequerimientoDto) {
    await this.assertArriendoPropiedadEnOrganizacion(dto.arriendoPropiedadId);
    if (dto.tecnicoId) {
      await this.assertPersonaEnOrganizacion(dto.tecnicoId);
    }

    const { presupuestos, ...datos } = dto;

    return this.prisma.requerimiento.create({
      data: {
        ...datos,
        presupuestos: presupuestos ? { create: presupuestos } : undefined,
      },
      include: DETALLE_INCLUDE,
    });
  }

  findAll(query: FindRequerimientosDto) {
    return this.prisma.requerimiento.findMany({
      where: {
        arriendoPropiedad: {
          id: query.arriendoPropiedadId,
          propiedad: { organizacionId: this.tenant.organizacionId },
        },
        estado: query.estado,
        urgencia: query.urgencia,
      },
      include: DETALLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const requerimiento = await this.prisma.requerimiento.findFirst({
      where: {
        id,
        arriendoPropiedad: { propiedad: { organizacionId: this.tenant.organizacionId } },
      },
      include: DETALLE_INCLUDE,
    });

    if (!requerimiento) {
      throw new NotFoundException('Requerimiento no encontrado');
    }

    return requerimiento;
  }

  async update(id: string, dto: UpdateRequerimientoDto) {
    await this.findOne(id);

    if (dto.arriendoPropiedadId) {
      await this.assertArriendoPropiedadEnOrganizacion(dto.arriendoPropiedadId);
    }
    if (dto.tecnicoId) {
      await this.assertPersonaEnOrganizacion(dto.tecnicoId);
    }

    return this.prisma.requerimiento.update({
      where: { id },
      data: dto,
      include: DETALLE_INCLUDE,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.requerimiento.delete({ where: { id } });
  }
}
