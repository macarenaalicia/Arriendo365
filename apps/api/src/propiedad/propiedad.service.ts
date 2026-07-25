import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { AdministradorBienService } from '../administrador-bien/administrador-bien.service';
import { CreatePropiedadDto } from './dto/create-propiedad.dto';
import { UpdatePropiedadDto } from './dto/update-propiedad.dto';

@Injectable()
export class PropiedadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
    private readonly administradorBien: AdministradorBienService,
  ) {}

  create(dto: CreatePropiedadDto) {
    return this.prisma.propiedad.create({
      data: { ...dto, organizacionId: this.tenant.organizacionId },
    });
  }

  async findAll() {
    const { propiedadIds } = await this.administradorBien.getFiltroBienesUsuarioActual();

    return this.prisma.propiedad.findMany({
      where: {
        organizacionId: this.tenant.organizacionId,
        ...(propiedadIds ? { id: { in: propiedadIds } } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const { propiedadIds } = await this.administradorBien.getFiltroBienesUsuarioActual();
    if (propiedadIds && !propiedadIds.includes(id)) {
      throw new NotFoundException('Propiedad no encontrada');
    }

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

  async duplicar(id: string) {
    const original = await this.findOne(id);
    const {
      id: _id,
      createdAt: _createdAt,
      updatedAt: _updatedAt,
      organizacionId: _organizacionId,
      proveedores,
      ...datos
    } = original;

    return this.prisma.propiedad.create({
      data: {
        ...datos,
        rol: `${datos.rol} (copia)`,
        organizacionId: this.tenant.organizacionId,
        proveedores: {
          create: proveedores.map(({ id: _pid, propiedadId: _propiedadId, ...p }) => p),
        },
      },
      include: { proveedores: true },
    });
  }
}
