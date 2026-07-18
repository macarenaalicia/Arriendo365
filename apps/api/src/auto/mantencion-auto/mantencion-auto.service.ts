import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateMantencionAutoDto } from './dto/create-mantencion-auto.dto';
import { UpdateMantencionAutoDto } from './dto/update-mantencion-auto.dto';

const DETALLE_INCLUDE = {
  items: { include: { configuracion: true } },
} as const;

@Injectable()
export class MantencionAutoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  private async assertAutoEnOrganizacion(autoId: string) {
    const auto = await this.prisma.auto.findFirst({
      where: {
        id: autoId,
        organizacionId: this.tenant.organizacionId,
        ...(this.tenant.esArrendatario
          ? { arriendos: { some: { arrendatarioId: this.tenant.personaId } } }
          : {}),
      },
    });
    if (!auto) {
      throw new NotFoundException('Auto no encontrado');
    }
  }

  private async assertConfiguracionesExisten(configuracionIds: string[]) {
    const cantidad = await this.prisma.configuracionMantencion.count({
      where: { id: { in: configuracionIds } },
    });
    if (cantidad !== configuracionIds.length) {
      throw new NotFoundException('Alguna configuración de mantención no fue encontrada');
    }
  }

  async create(autoId: string, dto: CreateMantencionAutoDto) {
    await this.assertAutoEnOrganizacion(autoId);
    await this.assertConfiguracionesExisten(dto.configuracionIds);

    // Igual que en Pago: si quien la registra es staff, queda aprobada de
    // inmediato (es un cobro que el propietario ya asumió, no un abono que
    // haya que verificar). Pero el estado de pago NO se asume: aunque sea
    // el propietario quien registre la mantención, igual debe transferirle
    // el monto al arrendatario si fue este quien la pagó, así que el estado
    // se elige explícitamente en el formulario.
    const autoAprobado = !this.tenant.esArrendatario;

    return this.prisma.mantencionAuto.create({
      data: {
        autoId,
        kilometrajeActual: dto.kilometrajeActual,
        kilometrajeProxima: dto.kilometrajeProxima,
        fechaMantencion: dto.fechaMantencion,
        costo: dto.costo,
        quienPago: dto.quienPago,
        aprobado: autoAprobado ? true : undefined,
        estadoPago: dto.estadoPago,
        items: { create: dto.configuracionIds.map((configuracionId) => ({ configuracionId })) },
      },
      include: DETALLE_INCLUDE,
    });
  }

  async findAll(autoId: string) {
    await this.assertAutoEnOrganizacion(autoId);

    return this.prisma.mantencionAuto.findMany({
      where: { autoId },
      include: DETALLE_INCLUDE,
      orderBy: { fechaMantencion: 'desc' },
    });
  }

  async findOne(autoId: string, id: string) {
    await this.assertAutoEnOrganizacion(autoId);

    const mantencion = await this.prisma.mantencionAuto.findFirst({
      where: { id, autoId },
      include: DETALLE_INCLUDE,
    });
    if (!mantencion) {
      throw new NotFoundException('Mantención no encontrada');
    }

    return mantencion;
  }

  async update(autoId: string, id: string, dto: UpdateMantencionAutoDto) {
    await this.findOne(autoId, id);
    if (dto.configuracionIds) {
      await this.assertConfiguracionesExisten(dto.configuracionIds);
    }

    return this.prisma.$transaction(async (tx) => {
      if (dto.configuracionIds) {
        await tx.mantencionAutoItem.deleteMany({ where: { mantencionAutoId: id } });
      }

      return tx.mantencionAuto.update({
        where: { id },
        data: {
          kilometrajeActual: dto.kilometrajeActual,
          kilometrajeProxima: dto.kilometrajeProxima,
          fechaMantencion: dto.fechaMantencion,
          costo: dto.costo,
          quienPago: dto.quienPago,
          estadoPago: dto.estadoPago,
          aprobado: dto.aprobado,
          motivoRechazo: dto.motivoRechazo,
          items: dto.configuracionIds
            ? { create: dto.configuracionIds.map((configuracionId) => ({ configuracionId })) }
            : undefined,
        },
        include: DETALLE_INCLUDE,
      });
    });
  }

  async remove(autoId: string, id: string) {
    await this.findOne(autoId, id);
    await this.prisma.mantencionAuto.delete({ where: { id } });
  }
}
