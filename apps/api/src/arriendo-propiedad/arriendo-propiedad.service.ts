import { BadRequestException, ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { PdfService } from '../pdf/pdf.service';
import { AdministradorBienService } from '../administrador-bien/administrador-bien.service';
import { CreateArriendoPropiedadDto } from './dto/create-arriendo-propiedad.dto';
import { UpdateArriendoPropiedadDto } from './dto/update-arriendo-propiedad.dto';
import { FindArriendosPropiedadDto } from './dto/find-arriendos-propiedad.dto';

const DETALLE_INCLUDE = {
  propiedad: true,
  arrendatario: true,
  codeudor: true,
} as const;

// Meses que representa cada valor de periodoAlza (campo de texto libre en
// el frontend, ver PERIODOS_ALZA). "SIN REAJUSTE" y cualquier otro valor no
// reconocido no proyectan una próxima fecha de alza.
const MESES_POR_PERIODO_ALZA: Record<string, number> = {
  MENSUAL: 1,
  TRIMESTRAL: 3,
  SEMESTRAL: 6,
  ANUAL: 12,
};

function sumarMeses(fecha: Date, meses: number): Date {
  const resultado = new Date(fecha);
  resultado.setMonth(resultado.getMonth() + meses);
  return resultado;
}

function proyectarReajuste<
  T extends {
    fechaEntrega: Date;
    ultimaAlzaFecha: Date | null;
    periodoAlza: string;
    ipcPorcentaje: unknown;
    montoArriendo: unknown;
  },
>(arriendo: T) {
  const meses = MESES_POR_PERIODO_ALZA[arriendo.periodoAlza];
  const ipc = arriendo.ipcPorcentaje === null ? null : Number(arriendo.ipcPorcentaje);

  if (!meses || ipc === null) {
    return { ...arriendo, proximaFechaAlza: null, montoProyectadoAlza: null };
  }

  const desde = arriendo.ultimaAlzaFecha ?? arriendo.fechaEntrega;
  const proximaFechaAlza = sumarMeses(desde, meses);
  const montoProyectadoAlza = Math.round(Number(arriendo.montoArriendo) * (1 + ipc / 100));

  return { ...arriendo, proximaFechaAlza, montoProyectadoAlza };
}

@Injectable()
export class ArriendoPropiedadService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
    private readonly pdf: PdfService,
    private readonly administradorBien: AdministradorBienService,
  ) {}

  private async assertPropiedadEnOrganizacion(propiedadId: string) {
    const propiedad = await this.prisma.propiedad.findFirst({
      where: { id: propiedadId, organizacionId: this.tenant.organizacionId },
    });
    if (!propiedad) {
      throw new NotFoundException('Propiedad no encontrada');
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

  private async assertSinArriendoActivo(propiedadId: string, excluirId?: string) {
    const activo = await this.prisma.arriendoPropiedad.findFirst({
      where: { propiedadId, estado: 'ACTIVO', id: excluirId ? { not: excluirId } : undefined },
    });
    if (activo) {
      throw new ConflictException('Esta propiedad ya tiene un arriendo activo');
    }
  }

  async create(dto: CreateArriendoPropiedadDto) {
    await this.assertPropiedadEnOrganizacion(dto.propiedadId);
    await this.assertPersonaEnOrganizacion(dto.arrendatarioId);
    if (dto.codeudorId) {
      await this.assertPersonaEnOrganizacion(dto.codeudorId);
    }
    if ((dto.estado ?? 'ACTIVO') === 'ACTIVO') {
      await this.assertSinArriendoActivo(dto.propiedadId);
    }

    const arriendo = await this.prisma.arriendoPropiedad.create({
      data: dto,
      include: DETALLE_INCLUDE,
    });
    return proyectarReajuste(arriendo);
  }

  private get filtroPropio() {
    if (!this.tenant.esArrendatario) return {};
    return {
      OR: [{ arrendatarioId: this.tenant.personaId }, { codeudorId: this.tenant.personaId }],
    };
  }

  async findAll(query: FindArriendosPropiedadDto) {
    const { propiedadIds } = await this.administradorBien.getFiltroBienesUsuarioActual();
    const arriendos = await this.prisma.arriendoPropiedad.findMany({
      where: {
        propiedad: { organizacionId: this.tenant.organizacionId },
        estado: query.estado,
        ...(propiedadIds ? { propiedadId: { in: propiedadIds } } : {}),
        ...this.filtroPropio,
      },
      include: DETALLE_INCLUDE,
      orderBy: { createdAt: 'desc' },
    });
    return arriendos.map(proyectarReajuste);
  }

  async findOne(id: string) {
    const { propiedadIds } = await this.administradorBien.getFiltroBienesUsuarioActual();
    const arriendo = await this.prisma.arriendoPropiedad.findFirst({
      where: {
        id,
        propiedad: { organizacionId: this.tenant.organizacionId },
        ...(propiedadIds ? { propiedadId: { in: propiedadIds } } : {}),
        ...this.filtroPropio,
      },
      include: { ...DETALLE_INCLUDE, inventario: true, requerimientos: true },
    });

    if (!arriendo) {
      throw new NotFoundException('Arriendo no encontrado');
    }

    if (!this.tenant.esArrendatario) {
      return proyectarReajuste(arriendo);
    }

    // El arrendatario no necesita ver sus propios datos bajo "arrendatario":
    // le interesa saber a quién contactar, es decir el dueño/administrador
    // de la organización dueña de la propiedad.
    const usuarioArrendador = await this.prisma.usuario.findFirst({
      where: {
        organizacionId: this.tenant.organizacionId,
        rol: { in: [RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO] },
      },
      include: { persona: true },
      orderBy: { createdAt: 'asc' },
    });

    return { ...proyectarReajuste(arriendo), arrendador: usuarioArrendador?.persona ?? null };
  }

  async update(id: string, dto: UpdateArriendoPropiedadDto) {
    const actual = await this.findOne(id);

    if (dto.propiedadId) {
      await this.assertPropiedadEnOrganizacion(dto.propiedadId);
    }
    if (dto.arrendatarioId) {
      await this.assertPersonaEnOrganizacion(dto.arrendatarioId);
    }
    if (dto.codeudorId) {
      await this.assertPersonaEnOrganizacion(dto.codeudorId);
    }

    const estadoDestino = dto.estado ?? actual.estado;
    if (estadoDestino === 'ACTIVO') {
      await this.assertSinArriendoActivo(dto.propiedadId ?? actual.propiedadId, id);
    }

    const actualizado = await this.prisma.arriendoPropiedad.update({
      where: { id },
      data: dto,
      include: DETALLE_INCLUDE,
    });
    return proyectarReajuste(actualizado);
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.arriendoPropiedad.delete({ where: { id } });
  }

  async aplicarReajusteIpc(id: string) {
    const actual = await this.findOne(id);
    if (actual.ipcPorcentaje === null) {
      throw new BadRequestException('Este arriendo no tiene un % de IPC configurado');
    }

    const proyeccion = proyectarReajuste(actual);
    if (proyeccion.montoProyectadoAlza === null) {
      throw new BadRequestException(
        'No se puede calcular el reajuste: revisa el período de alza pactado',
      );
    }

    const actualizado = await this.prisma.arriendoPropiedad.update({
      where: { id },
      data: { montoArriendo: proyeccion.montoProyectadoAlza, ultimaAlzaFecha: new Date() },
      include: DETALLE_INCLUDE,
    });
    return proyectarReajuste(actualizado);
  }

  async generarContratoPdf(id: string) {
    const { propiedadIds } = await this.administradorBien.getFiltroBienesUsuarioActual();
    const arriendo = await this.prisma.arriendoPropiedad.findFirst({
      where: {
        id,
        propiedad: { organizacionId: this.tenant.organizacionId },
        ...(propiedadIds ? { propiedadId: { in: propiedadIds } } : {}),
        ...this.filtroPropio,
      },
      include: DETALLE_INCLUDE,
    });
    if (!arriendo) {
      throw new NotFoundException('Arriendo no encontrado');
    }
    const organizacion = await this.prisma.organizacion.findUnique({
      where: { id: this.tenant.organizacionId },
    });
    return this.pdf.generarContratoArriendoPropiedad(arriendo, organizacion?.nombre ?? 'Arrendador');
  }
}
