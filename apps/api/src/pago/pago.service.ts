import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
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
            where: {
              id: arriendoId,
              auto: { organizacionId },
              ...(this.tenant.esArrendatario ? { arrendatarioId: this.tenant.personaId } : {}),
            },
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
      const [arriendosPropiedad, arriendosAuto] = await Promise.all([
        this.prisma.arriendoPropiedad.findMany({
          where: {
            propiedad: { organizacionId },
            OR: [
              { arrendatarioId: this.tenant.personaId },
              { codeudorId: this.tenant.personaId },
            ],
          },
          select: { id: true },
        }),
        this.prisma.arriendoAuto.findMany({
          where: { auto: { organizacionId }, arrendatarioId: this.tenant.personaId },
          select: { id: true },
        }),
      ]);
      return {
        propiedadIds: arriendosPropiedad.map((a) => a.id),
        autoIds: arriendosAuto.map((a) => a.id),
      };
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

  /**
   * Si ya pasó el día de pago del mes actual y no hay ningún pago de
   * arriendo registrado (no rechazado) para ese periodo, genera uno con
   * estado ATRASADO por el monto completo — para que el atraso quede
   * visible en el resumen aunque nadie haya alcanzado a registrar nada.
   */
  private async generarPagoAtrasadoSiCorresponde(arriendoId: string): Promise<void> {
    const arriendo = await this.prisma.arriendoPropiedad.findUnique({
      where: { id: arriendoId },
      select: { fechaPago: true, montoArriendo: true, estado: true },
    });
    if (!arriendo || arriendo.estado !== 'ACTIVO') return;

    const hoy = new Date();
    const ultimoDiaDelMes = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 0).getDate();
    const dia = Math.min(arriendo.fechaPago, ultimoDiaDelMes);
    const fechaVencimiento = new Date(hoy.getFullYear(), hoy.getMonth(), dia);
    if (hoy <= fechaVencimiento) return;

    const inicioMes = new Date(hoy.getFullYear(), hoy.getMonth(), 1);
    const inicioMesSiguiente = new Date(hoy.getFullYear(), hoy.getMonth() + 1, 1);

    const existente = await this.prisma.pago.findFirst({
      where: {
        arriendoTipo: 'propiedad',
        arriendoId,
        categoria: 'ARRIENDO',
        estado: { not: 'RECHAZADO' },
        fechaComprometida: { gte: inicioMes, lt: inicioMesSiguiente },
      },
    });
    if (existente) return;

    await this.prisma.pago.create({
      data: {
        arriendoTipo: 'propiedad',
        arriendoId,
        periodo: fechaVencimiento,
        fechaComprometida: fechaVencimiento,
        monto: arriendo.montoArriendo,
        estado: 'ATRASADO',
        esAbono: false,
        categoria: 'ARRIENDO',
      },
    });
  }

  private validarTipoServicio(categoria: CreatePagoDto['categoria'], tipoServicio: CreatePagoDto['tipoServicio']) {
    const esServiciosBasicos = (categoria ?? 'ARRIENDO') === 'SERVICIOS_BASICOS';
    if (esServiciosBasicos && !tipoServicio) {
      throw new BadRequestException('Elige a qué servicio corresponde el pago (agua, luz o gas)');
    }
    return esServiciosBasicos ? tipoServicio : null;
  }

  async create(dto: CreatePagoDto) {
    await this.assertArriendoEnOrganizacion(dto.arriendoTipo, dto.arriendoId);
    const tipoServicio = this.validarTipoServicio(dto.categoria, dto.tipoServicio);

    return this.prisma.pago.create({ data: { ...dto, tipoServicio } });
  }

  async findAll(query: FindPagosDto) {
    if (query.arriendoTipo && query.arriendoId) {
      await this.assertArriendoEnOrganizacion(query.arriendoTipo, query.arriendoId);
      if (query.arriendoTipo === 'propiedad') {
        await this.generarPagoAtrasadoSiCorresponde(query.arriendoId);
      }

      return this.prisma.pago.findMany({
        where: {
          arriendoTipo: query.arriendoTipo,
          arriendoId: query.arriendoId,
          estado: query.estado,
          categoria: query.categoria,
        },
        orderBy: { periodo: 'desc' },
      });
    }

    const { propiedadIds, autoIds } = await this.arriendoIdsDeLaOrganizacion();
    await Promise.all(propiedadIds.map((id) => this.generarPagoAtrasadoSiCorresponde(id)));

    const where: Prisma.PagoWhereInput = {
      estado: query.estado,
      categoria: query.categoria,
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
    await Promise.all(propiedadIds.map((id) => this.generarPagoAtrasadoSiCorresponde(id)));

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
