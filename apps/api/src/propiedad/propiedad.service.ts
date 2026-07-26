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

  // HABITACION/LOFT siempre necesitan madre (una CASA o DEPARTAMENTO, cuyas
  // cuentas de proveedores comparten). CASA/DEPARTAMENTO pueden tener madre
  // opcionalmente (una VECINDAD que solo las agrupa, cada una mantiene sus
  // propias cuentas). VECINDAD y TERRENO nunca tienen madre.
  private readonly TIPOS_MADRE_OBLIGATORIA = ['HABITACION', 'LOFT'];
  private readonly TIPOS_MADRE_OPCIONAL = ['CASA', 'DEPARTAMENTO'];

  private async assertPadreValido(dto: { tipo: string; propiedadPadreId?: string }) {
    const esObligatoria = this.TIPOS_MADRE_OBLIGATORIA.includes(dto.tipo);
    const esOpcional = this.TIPOS_MADRE_OPCIONAL.includes(dto.tipo);

    if (!esObligatoria && !esOpcional) {
      if (dto.propiedadPadreId) {
        throw new ConflictException(
          'Una vecindad o terreno no puede pertenecer a otra propiedad.',
        );
      }
      return;
    }

    if (esObligatoria && !dto.propiedadPadreId) {
      throw new ConflictException('Elige a qué propiedad pertenece esta habitación o loft.');
    }

    if (!dto.propiedadPadreId) return;

    const padre = await this.prisma.propiedad.findFirst({
      where: { id: dto.propiedadPadreId, organizacionId: this.tenant.organizacionId },
    });
    if (!padre) {
      throw new NotFoundException('La propiedad madre no existe');
    }
    if (padre.propiedadPadreId) {
      throw new ConflictException(
        'La propiedad madre no puede ser a su vez una pieza de otra propiedad (máximo 2 niveles).',
      );
    }

    if (esObligatoria && padre.tipo !== 'CASA' && padre.tipo !== 'DEPARTAMENTO') {
      throw new ConflictException('Una habitación o loft debe pertenecer a una casa o departamento.');
    }
    if (esOpcional && padre.tipo !== 'VECINDAD') {
      throw new ConflictException('Una casa o departamento solo puede pertenecer a una vecindad.');
    }
  }

  // Si una casa/vecindad no tiene una propia arrendada de forma directa (se
  // arrienda completa), su estado se deduce de sus piezas: si ninguna está
  // DISPONIBLE, queda ARRENDADA; si alguna sí, vuelve a DISPONIBLE. No pisa
  // EN_MANTENCION/USUFRUCTO puestos a mano — solo alterna entre esos dos.
  async sincronizarEstadoPadre(padreId: string) {
    const padre = await this.prisma.propiedad.findUnique({ where: { id: padreId } });
    if (!padre || (padre.estado !== 'DISPONIBLE' && padre.estado !== 'ARRENDADA')) return;

    const arriendoPropioActivo = await this.prisma.arriendoPropiedad.findFirst({
      where: { propiedadId: padreId, estado: 'ACTIVO' },
    });
    if (arriendoPropioActivo) return;

    const piezas = await this.prisma.propiedad.findMany({
      where: { propiedadPadreId: padreId },
      select: { estado: true },
    });
    if (piezas.length === 0) return;

    const hayDisponible = piezas.some((p) => p.estado === 'DISPONIBLE');
    const nuevoEstado = hayDisponible ? 'DISPONIBLE' : 'ARRENDADA';
    if (padre.estado !== nuevoEstado) {
      await this.prisma.propiedad.update({ where: { id: padreId }, data: { estado: nuevoEstado } });
    }
  }

  async create(dto: CreatePropiedadDto) {
    await this.assertPadreValido(dto);

    const creada = await this.prisma.propiedad.create({
      data: { ...dto, organizacionId: this.tenant.organizacionId },
    });

    if (creada.propiedadPadreId) {
      await this.sincronizarEstadoPadre(creada.propiedadPadreId);
    }

    return creada;
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

    const actualizada = await this.prisma.propiedad.update({
      where: { id },
      data: dto,
    });

    // El padre "viejo" también se recalcula si la pieza se movió a otra
    // propiedad madre (dejó una vacante donde estaba).
    if (dto.propiedadPadreId !== undefined && actual.propiedadPadreId !== actualizada.propiedadPadreId) {
      if (actual.propiedadPadreId) await this.sincronizarEstadoPadre(actual.propiedadPadreId);
    }
    if (actualizada.propiedadPadreId) {
      await this.sincronizarEstadoPadre(actualizada.propiedadPadreId);
    }

    return actualizada;
  }

  async remove(id: string) {
    const propiedad = await this.findOne(id);

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
        'No se puede eliminar una propiedad que tiene otras propiedades asociadas (habitaciones, lofts o casas).',
      );
    }

    await this.prisma.$transaction([
      this.prisma.proveedor.deleteMany({ where: { propiedadId: id } }),
      this.prisma.propiedad.delete({ where: { id } }),
    ]);

    if (propiedad.propiedadPadreId) {
      await this.sincronizarEstadoPadre(propiedad.propiedadPadreId);
    }
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
