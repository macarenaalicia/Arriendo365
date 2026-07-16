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
  actualizaciones: {
    include: {
      tecnico: true,
      usuario: { select: { id: true, rol: true, persona: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
} as const;

@Injectable()
export class RequerimientoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  private async assertArriendoPropiedadEnOrganizacion(arriendoPropiedadId: string) {
    const arriendo = await this.prisma.arriendoPropiedad.findFirst({
      where: {
        id: arriendoPropiedadId,
        propiedad: { organizacionId: this.tenant.organizacionId },
        ...this.filtroPropio,
      },
    });
    if (!arriendo) {
      throw new NotFoundException('Arriendo de propiedad no encontrado');
    }
  }

  private get filtroPropio() {
    if (!this.tenant.esArrendatario) return {};
    return {
      OR: [{ arrendatarioId: this.tenant.personaId }, { codeudorId: this.tenant.personaId }],
    };
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
          ...this.filtroPropio,
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
        arriendoPropiedad: {
          propiedad: { organizacionId: this.tenant.organizacionId },
          ...this.filtroPropio,
        },
      },
      include: DETALLE_INCLUDE,
    });

    if (!requerimiento) {
      throw new NotFoundException('Requerimiento no encontrado');
    }

    return requerimiento;
  }

  private huboCambios(
    actual: Awaited<ReturnType<RequerimientoService['findOne']>>,
    dto: UpdateRequerimientoDto,
  ): boolean {
    if (dto.arriendoPropiedadId !== undefined && dto.arriendoPropiedadId !== actual.arriendoPropiedadId) {
      return true;
    }
    if (dto.urgencia !== undefined && dto.urgencia !== actual.urgencia) return true;
    if (dto.estado !== undefined && dto.estado !== actual.estado) return true;
    if (dto.tipoReparacion !== undefined && dto.tipoReparacion !== actual.tipoReparacion) return true;
    if (dto.tecnicoId !== undefined && dto.tecnicoId !== actual.tecnicoId) return true;
    if (dto.notasArrendatario !== undefined && dto.notasArrendatario !== actual.notasArrendatario) {
      return true;
    }
    if (dto.notasInternas !== undefined && dto.notasInternas !== actual.notasInternas) return true;
    if (dto.detalleResolucion !== undefined && dto.detalleResolucion !== actual.detalleResolucion) {
      return true;
    }
    if (
      dto.fechaComprometida !== undefined &&
      actual.fechaComprometida?.getTime() !== dto.fechaComprometida.getTime()
    ) {
      return true;
    }
    if (
      dto.fechaSolucion !== undefined &&
      actual.fechaSolucion?.getTime() !== dto.fechaSolucion.getTime()
    ) {
      return true;
    }
    if (dto.valorPagado !== undefined && Number(actual.valorPagado) !== dto.valorPagado) return true;
    if (dto.quienPago !== undefined && dto.quienPago !== actual.quienPago) return true;

    return false;
  }

  async update(id: string, dto: UpdateRequerimientoDto) {
    const actual = await this.findOne(id);

    if (dto.arriendoPropiedadId) {
      await this.assertArriendoPropiedadEnOrganizacion(dto.arriendoPropiedadId);
    }
    if (dto.tecnicoId) {
      await this.assertPersonaEnOrganizacion(dto.tecnicoId);
    }

    const cambia = this.huboCambios(actual, dto);
    const { notaActualizacion, ...datos } = dto;

    return this.prisma.requerimiento.update({
      where: { id },
      data: {
        ...datos,
        // Se guarda el estado ANTERIOR (previo a este update) como snapshot,
        // no una descripción del cambio, para poder comparar la fila vigente
        // contra sus versiones previas usando las mismas columnas.
        actualizaciones: cambia
          ? {
              create: {
                urgencia: actual.urgencia,
                estado: actual.estado,
                tipoReparacion: actual.tipoReparacion,
                tecnicoId: actual.tecnicoId,
                notasArrendatario: actual.notasArrendatario,
                detalleResolucion: actual.detalleResolucion,
                nota: notaActualizacion,
                usuarioId: this.tenant.usuarioId,
              },
            }
          : undefined,
      },
      include: DETALLE_INCLUDE,
    });
  }
}
