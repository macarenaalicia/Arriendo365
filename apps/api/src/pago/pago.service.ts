import { Injectable, NotFoundException } from '@nestjs/common';
import { EstadoPago, Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { ArriendoTipo, CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { FindPagosDto } from './dto/find-pagos.dto';

@Injectable()
export class PagoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  private async assertArriendoEnOrganizacion(arriendoTipo: ArriendoTipo, arriendoId: string) {
    const organizacionId = this.tenant.organizacionId;

    if (this.tenant.esArrendatario && arriendoTipo === 'auto') {
      throw new NotFoundException('Arriendo no encontrado');
    }

    const existe =
      arriendoTipo === 'propiedad'
        ? await this.prisma.arriendoPropiedad.findFirst({
            where: {
              id: arriendoId,
              propiedad: { organizacionId },
              ...(this.tenant.esArrendatario
                ? {
                    OR: [
                      { arrendatarioId: this.tenant.personaId },
                      { codeudorId: this.tenant.personaId },
                    ],
                  }
                : {}),
            },
          })
        : await this.prisma.arriendoAuto.findFirst({
            where: { id: arriendoId, auto: { organizacionId } },
          });

    if (!existe) {
      throw new NotFoundException('Arriendo no encontrado');
    }
  }

  private async arriendoIdsDeLaOrganizacion(): Promise<{
    propiedadIds: string[];
    autoIds: string[];
  }> {
    const organizacionId = this.tenant.organizacionId;

    if (this.tenant.esArrendatario) {
      const arriendosPropiedad = await this.prisma.arriendoPropiedad.findMany({
        where: {
          propiedad: { organizacionId },
          OR: [
            { arrendatarioId: this.tenant.personaId },
            { codeudorId: this.tenant.personaId },
          ],
        },
        select: { id: true },
      });
      return { propiedadIds: arriendosPropiedad.map((a) => a.id), autoIds: [] };
    }

    const [arriendosPropiedad, arriendosAuto] = await Promise.all([
      this.prisma.arriendoPropiedad.findMany({
        where: { propiedad: { organizacionId } },
        select: { id: true },
      }),
      this.prisma.arriendoAuto.findMany({
        where: { auto: { organizacionId } },
        select: { id: true },
      }),
    ]);

    return {
      propiedadIds: arriendosPropiedad.map((a) => a.id),
      autoIds: arriendosAuto.map((a) => a.id),
    };
  }

  async create(dto: CreatePagoDto) {
    await this.assertArriendoEnOrganizacion(dto.arriendoTipo, dto.arriendoId);

    return this.prisma.pago.create({ data: dto });
  }

  async findAll(query: FindPagosDto) {
    if (query.arriendoTipo && query.arriendoId) {
      await this.assertArriendoEnOrganizacion(query.arriendoTipo, query.arriendoId);

      return this.prisma.pago.findMany({
        where: {
          arriendoTipo: query.arriendoTipo,
          arriendoId: query.arriendoId,
          estado: query.estado,
        },
        orderBy: { periodo: 'desc' },
      });
    }

    const { propiedadIds, autoIds } = await this.arriendoIdsDeLaOrganizacion();

    const where: Prisma.PagoWhereInput = {
      estado: query.estado,
      OR: [
        { arriendoTipo: 'propiedad', arriendoId: { in: propiedadIds } },
        { arriendoTipo: 'auto', arriendoId: { in: autoIds } },
      ],
    };

    return this.prisma.pago.findMany({ where, orderBy: { periodo: 'desc' } });
  }

  async findOne(id: string) {
    const pago = await this.prisma.pago.findUnique({ where: { id } });
    if (!pago) {
      throw new NotFoundException('Pago no encontrado');
    }

    await this.assertArriendoEnOrganizacion(pago.arriendoTipo as ArriendoTipo, pago.arriendoId);

    return pago;
  }

  async update(id: string, dto: UpdatePagoDto) {
    const pago = await this.findOne(id);

    if (dto.arriendoTipo && dto.arriendoId) {
      await this.assertArriendoEnOrganizacion(dto.arriendoTipo, dto.arriendoId);
    }

    return this.prisma.pago.update({ where: { id: pago.id }, data: dto });
  }

  async remove(id: string) {
    const pago = await this.findOne(id);
    await this.prisma.pago.delete({ where: { id: pago.id } });
  }

  async resumen() {
    const { propiedadIds, autoIds } = await this.arriendoIdsDeLaOrganizacion();

    const pagos = await this.prisma.pago.findMany({
      where: {
        OR: [
          { arriendoTipo: 'propiedad', arriendoId: { in: propiedadIds } },
          { arriendoTipo: 'auto', arriendoId: { in: autoIds } },
        ],
      },
      select: { estado: true, monto: true },
    });

    const porEstado: Record<EstadoPago, { cantidad: number; montoTotal: number }> = {
      PENDIENTE: { cantidad: 0, montoTotal: 0 },
      PAGADO: { cantidad: 0, montoTotal: 0 },
      ATRASADO: { cantidad: 0, montoTotal: 0 },
      RECHAZADO: { cantidad: 0, montoTotal: 0 },
    };

    for (const pago of pagos) {
      porEstado[pago.estado].cantidad += 1;
      porEstado[pago.estado].montoTotal += Number(pago.monto);
    }

    return {
      porEstado,
      montoTotalGeneral: pagos.reduce((acc, p) => acc + Number(p.monto), 0),
    };
  }
}
