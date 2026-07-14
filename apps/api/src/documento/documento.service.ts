import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { EntidadResolverService } from '../common/entidad/entidad-resolver.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { FindDocumentosDto } from './dto/find-documentos.dto';

@Injectable()
export class DocumentoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
    private readonly entidadResolver: EntidadResolverService,
  ) {}

  async create(dto: CreateDocumentoDto) {
    await this.entidadResolver.assertEntidadEnOrganizacion(
      dto.entidadTipo,
      dto.entidadId,
      this.tenant.organizacionId,
    );

    return this.prisma.documento.create({ data: dto });
  }

  async findAll(query: FindDocumentosDto) {
    await this.entidadResolver.assertEntidadEnOrganizacion(
      query.entidadTipo,
      query.entidadId,
      this.tenant.organizacionId,
    );

    return this.prisma.documento.findMany({
      where: { entidadTipo: query.entidadTipo, entidadId: query.entidadId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const documento = await this.prisma.documento.findUnique({ where: { id } });
    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    await this.entidadResolver.assertEntidadEnOrganizacion(
      documento.entidadTipo as FindDocumentosDto['entidadTipo'],
      documento.entidadId,
      this.tenant.organizacionId,
    );

    return documento;
  }

  async remove(id: string) {
    const documento = await this.findOne(id);
    await this.prisma.documento.delete({ where: { id: documento.id } });
  }
}
