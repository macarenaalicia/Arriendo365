import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CreateProveedorDto } from './dto/create-proveedor.dto';
import { UpdateProveedorDto } from './dto/update-proveedor.dto';

@Injectable()
export class ProveedorService {
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

  async create(propiedadId: string, dto: CreateProveedorDto) {
    await this.assertPropiedadEnOrganizacion(propiedadId);

    return this.prisma.proveedor.create({
      data: { ...dto, propiedadId },
    });
  }

  async findAll(propiedadId: string) {
    await this.assertPropiedadEnOrganizacion(propiedadId);

    return this.prisma.proveedor.findMany({ where: { propiedadId } });
  }

  async findOne(propiedadId: string, id: string) {
    await this.assertPropiedadEnOrganizacion(propiedadId);

    const proveedor = await this.prisma.proveedor.findFirst({
      where: { id, propiedadId },
    });

    if (!proveedor) {
      throw new NotFoundException('Proveedor no encontrado');
    }

    return proveedor;
  }

  async update(propiedadId: string, id: string, dto: UpdateProveedorDto) {
    await this.findOne(propiedadId, id);

    return this.prisma.proveedor.update({
      where: { id },
      data: dto,
    });
  }

  async remove(propiedadId: string, id: string) {
    await this.findOne(propiedadId, id);
    await this.prisma.proveedor.delete({ where: { id } });
  }
}
