import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateGastoDto } from './dto/create-gasto.dto';
import { UpdateGastoDto } from './dto/update-gasto.dto';

@Injectable()
export class GastoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  private async assertRequerimientoEnOrganizacion(requerimientoId: string) {
    const requerimiento = await this.prisma.requerimiento.findFirst({
      where: {
        id: requerimientoId,
        arriendoPropiedad: { propiedad: { organizacionId: this.tenant.organizacionId } },
      },
    });
    if (!requerimiento) {
      throw new NotFoundException('Requerimiento no encontrado');
    }
  }

  async create(requerimientoId: string, dto: CreateGastoDto) {
    await this.assertRequerimientoEnOrganizacion(requerimientoId);

    return this.prisma.gasto.create({ data: { ...dto, requerimientoId } });
  }

  async findAll(requerimientoId: string) {
    await this.assertRequerimientoEnOrganizacion(requerimientoId);

    return this.prisma.gasto.findMany({ where: { requerimientoId } });
  }

  async findOne(requerimientoId: string, id: string) {
    await this.assertRequerimientoEnOrganizacion(requerimientoId);

    const gasto = await this.prisma.gasto.findFirst({ where: { id, requerimientoId } });
    if (!gasto) {
      throw new NotFoundException('Gasto no encontrado');
    }

    return gasto;
  }

  async update(requerimientoId: string, id: string, dto: UpdateGastoDto) {
    await this.findOne(requerimientoId, id);

    return this.prisma.gasto.update({ where: { id }, data: dto });
  }

  async remove(requerimientoId: string, id: string) {
    await this.findOne(requerimientoId, id);
    await this.prisma.gasto.delete({ where: { id } });
  }
}
