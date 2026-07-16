import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

const SELECT_PROPIEDAD_PUBLICA = {
  id: true,
  tipo: true,
  calle: true,
  numero: true,
  numeroDepartamento: true,
  sector: true,
  ciudad: true,
  region: true,
  nHabitaciones: true,
  nBanos: true,
  bodega: true,
  estacionamiento: true,
  mt2Totales: true,
  mt2Construidos: true,
  descripcion: true,
  precioArriendoEsperado: true,
} as const;

@Injectable()
export class PublicPropiedadesService {
  constructor(private readonly prisma: PrismaService) {}

  private async assertOrganizacionActiva(organizacionId: string) {
    const organizacion = await this.prisma.organizacion.findFirst({
      where: { id: organizacionId, activo: true },
    });
    if (!organizacion) {
      throw new NotFoundException('Organización no encontrada');
    }
  }

  private async fotosPorPropiedad(propiedadIds: string[]) {
    if (propiedadIds.length === 0) return new Map<string, { id: string; archivoUrl: string; descripcion: string | null }[]>();

    const fotos = await this.prisma.foto.findMany({
      where: { entidadTipo: 'propiedad', entidadId: { in: propiedadIds } },
      orderBy: { createdAt: 'asc' },
      select: { id: true, archivoUrl: true, descripcion: true, entidadId: true },
    });

    const porPropiedad = new Map<string, { id: string; archivoUrl: string; descripcion: string | null }[]>();
    for (const foto of fotos) {
      const lista = porPropiedad.get(foto.entidadId) ?? [];
      lista.push({ id: foto.id, archivoUrl: foto.archivoUrl, descripcion: foto.descripcion });
      porPropiedad.set(foto.entidadId, lista);
    }
    return porPropiedad;
  }

  async findAll(organizacionId: string) {
    await this.assertOrganizacionActiva(organizacionId);

    const propiedades = await this.prisma.propiedad.findMany({
      where: { organizacionId, estado: 'DISPONIBLE' },
      select: SELECT_PROPIEDAD_PUBLICA,
      orderBy: { createdAt: 'desc' },
    });

    const fotosPorPropiedad = await this.fotosPorPropiedad(propiedades.map((p) => p.id));

    return propiedades.map((propiedad) => ({
      ...propiedad,
      fotos: fotosPorPropiedad.get(propiedad.id) ?? [],
    }));
  }

  async findOne(organizacionId: string, id: string) {
    await this.assertOrganizacionActiva(organizacionId);

    const propiedad = await this.prisma.propiedad.findFirst({
      where: { id, organizacionId, estado: 'DISPONIBLE' },
      select: SELECT_PROPIEDAD_PUBLICA,
    });

    if (!propiedad) {
      throw new NotFoundException('Propiedad no encontrada');
    }

    const fotosPorPropiedad = await this.fotosPorPropiedad([propiedad.id]);

    return { ...propiedad, fotos: fotosPorPropiedad.get(propiedad.id) ?? [] };
  }
}
