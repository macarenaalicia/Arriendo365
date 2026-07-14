import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateMantencionAutoDto } from './dto/create-mantencion-auto.dto';
import { UpdateMantencionAutoDto } from './dto/update-mantencion-auto.dto';

@Injectable()
export class MantencionAutoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  private async assertAutoEnOrganizacion(autoId: string) {
    const auto = await this.prisma.auto.findFirst({
      where: { id: autoId, organizacionId: this.tenant.organizacionId },
    });
    if (!auto) {
      throw new NotFoundException('Auto no encontrado');
    }
  }

  private async assertConfiguracionExiste(configuracionId: string) {
    const configuracion = await this.prisma.configuracionMantencion.findUnique({
      where: { id: configuracionId },
    });
    if (!configuracion) {
      throw new NotFoundException('Configuración de mantención no encontrada');
    }
  }

  async create(autoId: string, dto: CreateMantencionAutoDto) {
    await this.assertAutoEnOrganizacion(autoId);
    await this.assertConfiguracionExiste(dto.configuracionId);

    return this.prisma.mantencionAuto.create({
      data: { ...dto, autoId },
      include: { configuracion: true },
    });
  }

  async findAll(autoId: string) {
    await this.assertAutoEnOrganizacion(autoId);

    return this.prisma.mantencionAuto.findMany({
      where: { autoId },
      include: { configuracion: true },
      orderBy: { fechaMantencion: 'desc' },
    });
  }

  async findOne(autoId: string, id: string) {
    await this.assertAutoEnOrganizacion(autoId);

    const mantencion = await this.prisma.mantencionAuto.findFirst({
      where: { id, autoId },
      include: { configuracion: true },
    });
    if (!mantencion) {
      throw new NotFoundException('Mantención no encontrada');
    }

    return mantencion;
  }

  async update(autoId: string, id: string, dto: UpdateMantencionAutoDto) {
    await this.findOne(autoId, id);
    if (dto.configuracionId) {
      await this.assertConfiguracionExiste(dto.configuracionId);
    }

    return this.prisma.mantencionAuto.update({
      where: { id },
      data: dto,
      include: { configuracion: true },
    });
  }

  async remove(autoId: string, id: string) {
    await this.findOne(autoId, id);
    await this.prisma.mantencionAuto.delete({ where: { id } });
  }
}
