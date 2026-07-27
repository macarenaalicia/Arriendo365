import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { AdministradorBienService } from '../administrador-bien/administrador-bien.service';
import { CreateArriendoAutoDto } from './dto/create-arriendo-auto.dto';
import { UpdateArriendoAutoDto } from './dto/update-arriendo-auto.dto';
import { FindArriendosAutoDto } from './dto/find-arriendos-auto.dto';

const DETALLE_INCLUDE = {
  auto: true,
  arrendatario: true,
  cuentaBancaria: true,
} as const;

@Injectable()
export class ArriendoAutoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
    private readonly administradorBien: AdministradorBienService,
  ) {}

  private async assertAutoEnOrganizacion(autoId: string) {
    const auto = await this.prisma.auto.findFirst({
      where: { id: autoId, organizacionId: this.tenant.organizacionId },
    });
    if (!auto) {
      throw new NotFoundException('Auto no encontrado');
    }
  }

  private async assertPersonaEnOrganizacion(personaId: string) {
    const persona = await this.prisma.persona.findFirst({
      where: { id: personaId, organizacionId: this.tenant.organizacionId },
    });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }
  }

  private async assertCuentaBancariaEnOrganizacion(cuentaBancariaId: string) {
    const cuenta = await this.prisma.cuentaBancaria.findFirst({
      where: { id: cuentaBancariaId, organizacionId: this.tenant.organizacionId },
    });
    if (!cuenta) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }
  }

  private async assertSinArriendoActivo(autoId: string, excluirId?: string) {
    const activo = await this.prisma.arriendoAuto.findFirst({
      where: { autoId, estado: 'ACTIVO', id: excluirId ? { not: excluirId } : undefined },
    });
    if (activo) {
      throw new ConflictException('Este auto ya tiene un arriendo activo');
    }
  }

  // Al crear/terminar un contrato, el auto refleja solo si está disponible
  // o arrendado — igual que con propiedades.
  private async sincronizarEstadoAuto(autoId: string, estadoArriendo: string) {
    if (estadoArriendo === 'ACTIVO') {
      await this.prisma.auto.update({ where: { id: autoId }, data: { estado: 'ARRENDADO' } });
    } else if (estadoArriendo === 'TERMINADO' || estadoArriendo === 'INACTIVO') {
      await this.prisma.auto.update({ where: { id: autoId }, data: { estado: 'DISPONIBLE' } });
    }
  }

  async create(dto: CreateArriendoAutoDto) {
    await this.assertAutoEnOrganizacion(dto.autoId);
    await this.assertPersonaEnOrganizacion(dto.arrendatarioId);
    if (dto.cuentaBancariaId) {
      await this.assertCuentaBancariaEnOrganizacion(dto.cuentaBancariaId);
    }
    const estadoDestino = dto.estado ?? 'ACTIVO';
    if (estadoDestino === 'ACTIVO') {
      await this.assertSinArriendoActivo(dto.autoId);
    }

    const arriendo = await this.prisma.arriendoAuto.create({
      data: { ...dto, cuentaBancariaId: dto.pagaEnEfectivo ? undefined : dto.cuentaBancariaId },
      include: DETALLE_INCLUDE,
    });
    await this.sincronizarEstadoAuto(dto.autoId, estadoDestino);
    return arriendo;
  }

  async findAll(query: FindArriendosAutoDto) {
    const { autoIds } = await this.administradorBien.getFiltroBienesUsuarioActual();
    return this.prisma.arriendoAuto.findMany({
      where: {
        auto: {
          organizacionId: this.tenant.organizacionId,
          ...(autoIds ? { id: { in: autoIds } } : {}),
        },
        estado: query.estado,
        autoId: query.autoId,
        arrendatarioId: this.tenant.esArrendatario ? this.tenant.personaId : undefined,
      },
      include: DETALLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const { autoIds } = await this.administradorBien.getFiltroBienesUsuarioActual();
    const arriendo = await this.prisma.arriendoAuto.findFirst({
      where: {
        id,
        auto: { organizacionId: this.tenant.organizacionId },
        ...(autoIds ? { autoId: { in: autoIds } } : {}),
        arrendatarioId: this.tenant.esArrendatario ? this.tenant.personaId : undefined,
      },
      include: DETALLE_INCLUDE,
    });

    if (!arriendo) {
      throw new NotFoundException('Arriendo de auto no encontrado');
    }

    return arriendo;
  }

  async update(id: string, dto: UpdateArriendoAutoDto) {
    const actual = await this.findOne(id);

    if (dto.autoId) {
      await this.assertAutoEnOrganizacion(dto.autoId);
    }
    if (dto.arrendatarioId) {
      await this.assertPersonaEnOrganizacion(dto.arrendatarioId);
    }
    if (dto.cuentaBancariaId) {
      await this.assertCuentaBancariaEnOrganizacion(dto.cuentaBancariaId);
    }

    const estadoDestino = dto.estado ?? actual.estado;
    if (estadoDestino === 'ACTIVO') {
      await this.assertSinArriendoActivo(dto.autoId ?? actual.autoId, id);
    }

    const actualizado = await this.prisma.arriendoAuto.update({
      where: { id },
      data: { ...dto, cuentaBancariaId: dto.pagaEnEfectivo ? null : dto.cuentaBancariaId },
      include: DETALLE_INCLUDE,
    });

    if (dto.estado !== undefined && dto.estado !== actual.estado) {
      await this.sincronizarEstadoAuto(dto.autoId ?? actual.autoId, estadoDestino);
    }

    return actualizado;
  }

  async remove(id: string) {
    const arriendo = await this.findOne(id);
    await this.prisma.arriendoAuto.delete({ where: { id } });
    if (arriendo.estado === 'ACTIVO') {
      await this.sincronizarEstadoAuto(arriendo.autoId, 'TERMINADO');
    }
  }
}
