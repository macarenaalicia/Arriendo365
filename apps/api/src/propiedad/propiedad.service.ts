import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
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

  private async assertPadreValido(dto: { tipo: string; propiedadPadreId?: string }) {
    const esPieza = dto.tipo === 'HABITACION' || dto.tipo === 'LOFT';

    if (!esPieza) {
      if (dto.propiedadPadreId) {
        throw new ConflictException(
          'Solo una habitación o loft puede tener una propiedad madre.',
        );
      }
      return;
    }

    if (!dto.propiedadPadreId) {
      throw new ConflictException('Elige a qué propiedad pertenece esta habitación o loft.');
    }

    const padre = await this.prisma.propiedad.findFirst({
      where: { id: dto.propiedadPadreId, organizacionId: this.tenant.organizacionId },
    });
    if (!padre) {
      throw new NotFoundException('La propiedad madre no existe');
    }
    if (padre.propiedadPadreId) {
      throw new ConflictException(
        'La propiedad madre no puede ser a su vez una habitación o loft de otra propiedad.',
      );
    }
  }

  async create(dto: CreatePropiedadDto) {
    await this.assertPadreValido(dto);

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
    const actual = await this.findOne(id);

    if (dto.tipo !== undefined || dto.propiedadPadreId !== undefined) {
      await this.assertPadreValido({
        tipo: dto.tipo ?? actual.tipo,
        propiedadPadreId:
          dto.propiedadPadreId !== undefined ? dto.propiedadPadreId : (actual.propiedadPadreId ?? undefined),
      });
    }

    return this.prisma.propiedad.update({
      where: { id },
      data: dto,
    });
  }

  async remove(id: string) {
    await this.findOne(id);

    const tieneArriendos = await this.prisma.arriendoPropiedad.findFirst({
      where: { propiedadId: id },
    });
    if (tieneArriendos) {
      throw new ConflictException(
        'No se puede eliminar una propiedad que tiene arriendos registrados.',
      );
    }

    const tienePiezas = await this.prisma.propiedad.findFirst({
      where: { propiedadPadreId: id },
    });
    if (tienePiezas) {
      throw new ConflictException(
        'No se puede eliminar una propiedad que tiene habitaciones o lofts asociados.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.proveedor.deleteMany({ where: { propiedadId: id } }),
      this.prisma.propiedad.delete({ where: { id } }),
    ]);
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
        numero: `${datos.numero} (copia)`,
        organizacionId: this.tenant.organizacionId,
        proveedores: {
          create: proveedores.map(({ id: _pid, propiedadId: _propiedadId, ...p }) => p),
        },
      },
      include: { proveedores: true },
    });
  }
}
