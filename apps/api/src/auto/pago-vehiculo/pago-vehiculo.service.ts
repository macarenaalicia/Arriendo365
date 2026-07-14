import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreatePagoVehiculoDto } from './dto/create-pago-vehiculo.dto';
import { UpdatePagoVehiculoDto } from './dto/update-pago-vehiculo.dto';

@Injectable()
export class PagoVehiculoService {
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

  async create(autoId: string, dto: CreatePagoVehiculoDto) {
    await this.assertAutoEnOrganizacion(autoId);

    return this.prisma.pagoVehiculo.create({ data: { ...dto, autoId } });
  }

  async findAll(autoId: string) {
    await this.assertAutoEnOrganizacion(autoId);

    return this.prisma.pagoVehiculo.findMany({
      where: { autoId },
      orderBy: { fechaPago: 'desc' },
    });
  }

  async findOne(autoId: string, id: string) {
    await this.assertAutoEnOrganizacion(autoId);

    const pago = await this.prisma.pagoVehiculo.findFirst({ where: { id, autoId } });
    if (!pago) {
      throw new NotFoundException('Pago de vehículo no encontrado');
    }

    return pago;
  }

  async update(autoId: string, id: string, dto: UpdatePagoVehiculoDto) {
    await this.findOne(autoId, id);

    return this.prisma.pagoVehiculo.update({ where: { id }, data: dto });
  }

  async remove(autoId: string, id: string) {
    await this.findOne(autoId, id);
    await this.prisma.pagoVehiculo.delete({ where: { id } });
  }
}
