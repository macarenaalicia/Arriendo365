import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CreatePropiedadDto } from './dto/create-propiedad.dto';
import { UpdatePropiedadDto } from './dto/update-propiedad.dto';

@Injectable()
export class PropiedadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  create(dto: CreatePropiedadDto) {
    return this.prisma.propiedad.create({
      data: { ...dto, organizacionId: this.tenant.organizacionId },
    });
  }

  findAll() {
    return this.prisma.propiedad.findMany({
      where: { organizacionId: this.tenant.organizacionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const propiedad = await this.prisma.propiedad.findFirst({
      where: { id, organizacionId: this.tenant.organizacionId },
      include: { proveedores: true },
    });

    if (!propiedad) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    return propiedad;
  }

  async update(id: string, dto: UpdatePropiedadDto) {
    await this.findOne(id);

    return this.prisma.propiedad.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.propiedad.delete({ where: { id } });
  }
}
