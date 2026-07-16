import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { EntidadResolverService } from '../common/entidad/entidad-resolver.service';
import type { EntidadTipo } from '../common/entidad/entidad-resolver.service';
import { CreateFotoDto } from './dto/create-foto.dto';
import { FindFotosDto } from './dto/find-fotos.dto';

@Injectable()
export class FotoService {
  private static readonly MAX_FOTOS_REQUERIMIENTO = 3;

  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
    private readonly entidadResolver: EntidadResolverService,
  ) {}

  // Un arrendatario solo gestiona fotos de sus propios requerimientos; el
  // resto de entidades (propiedad, persona, auto, etc.) quedan reservadas
  // al staff.
  private assertEntidadPermitidaParaRol(entidadTipo: EntidadTipo) {
    if (this.tenant.esArrendatario && entidadTipo !== 'requerimiento') {
      throw new ForbiddenException('No tienes acceso a fotos de este tipo de entidad');
    }
  }

  async create(dto: CreateFotoDto) {
    this.assertEntidadPermitidaParaRol(dto.entidadTipo);
    await this.entidadResolver.assertEntidadEnOrganizacion(
      dto.entidadTipo,
      dto.entidadId,
      this.tenant.organizacionId,
    );

    if (dto.entidadTipo === 'requerimiento') {
      const cantidad = await this.prisma.foto.count({
        where: { entidadTipo: dto.entidadTipo, entidadId: dto.entidadId },
      });
      if (cantidad >= FotoService.MAX_FOTOS_REQUERIMIENTO) {
        throw new BadRequestException(
          `Un requerimiento admite un máximo de ${FotoService.MAX_FOTOS_REQUERIMIENTO} fotos`,
        );
      }
    }

    return this.prisma.foto.create({ data: dto });
  }

  async findAll(query: FindFotosDto) {
    this.assertEntidadPermitidaParaRol(query.entidadTipo);
    await this.entidadResolver.assertEntidadEnOrganizacion(
      query.entidadTipo,
      query.entidadId,
      this.tenant.organizacionId,
    );

    return this.prisma.foto.findMany({
      where: { entidadTipo: query.entidadTipo, entidadId: query.entidadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const foto = await this.prisma.foto.findUnique({ where: { id } });
    if (!foto) {
      throw new NotFoundException('Foto no encontrada');
    }

    this.assertEntidadPermitidaParaRol(foto.entidadTipo as EntidadTipo);
    await this.entidadResolver.assertEntidadEnOrganizacion(
      foto.entidadTipo as EntidadTipo,
      foto.entidadId,
      this.tenant.organizacionId,
    );

    return foto;
  }

  async remove(id: string) {
    const foto = await this.findOne(id);
    await this.prisma.foto.delete({ where: { id: foto.id } });
  }
}
