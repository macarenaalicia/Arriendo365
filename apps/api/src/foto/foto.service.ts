import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { EntidadResolverService } from '../common/entidad/entidad-resolver.service';
import { CreateFotoDto } from './dto/create-foto.dto';
import { FindFotosDto } from './dto/find-fotos.dto';

@Injectable()
export class FotoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
    private readonly entidadResolver: EntidadResolverService,
  ) {}

  async create(dto: CreateFotoDto) {
    await this.entidadResolver.assertEntidadEnOrganizacion(
      dto.entidadTipo,
      dto.entidadId,
      this.tenant.organizacionId,
    );

    return this.prisma.foto.create({ data: dto });
  }

  async findAll(query: FindFotosDto) {
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

    await this.entidadResolver.assertEntidadEnOrganizacion(
      foto.entidadTipo as FindFotosDto['entidadTipo'],
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
