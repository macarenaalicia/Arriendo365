import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CreateArriendoAutoDto } from './dto/create-arriendo-auto.dto';
import { UpdateArriendoAutoDto } from './dto/update-arriendo-auto.dto';
import { FindArriendosAutoDto } from './dto/find-arriendos-auto.dto';

const DETALLE_INCLUDE = {
  auto: true,
  arrendatario: true,
} as const;

@Injectable()
export class ArriendoAutoService {
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

  private async assertPersonaEnOrganizacion(personaId: string) {
    const persona = await this.prisma.persona.findFirst({
      where: { id: personaId, organizacionId: this.tenant.organizacionId },
    });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }
  }

  async create(dto: CreateArriendoAutoDto) {
    await this.assertAutoEnOrganizacion(dto.autoId);
    await this.assertPersonaEnOrganizacion(dto.arrendatarioId);

    return this.prisma.arriendoAuto.create({ data: dto, include: DETALLE_INCLUDE });
  }

  findAll(query: FindArriendosAutoDto) {
    return this.prisma.arriendoAuto.findMany({
      where: {
        auto: { organizacionId: this.tenant.organizacionId },
        estado: query.estado,
        autoId: query.autoId,
        arrendatarioId: this.tenant.esArrendatario ? this.tenant.personaId : undefined,
      },
      include: DETALLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const arriendo = await this.prisma.arriendoAuto.findFirst({
      where: {
        id,
        auto: { organizacionId: this.tenant.organizacionId },
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
    await this.findOne(id);

    if (dto.autoId) {
      await this.assertAutoEnOrganizacion(dto.autoId);
    }
    if (dto.arrendatarioId) {
      await this.assertPersonaEnOrganizacion(dto.arrendatarioId);
    }

    return this.prisma.arriendoAuto.update({ where: { id }, data: dto, include: DETALLE_INCLUDE });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.arriendoAuto.delete({ where: { id } });
  }
}
