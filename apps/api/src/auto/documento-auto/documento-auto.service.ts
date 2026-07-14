import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateDocumentoAutoDto } from './dto/create-documento-auto.dto';
import { UpdateDocumentoAutoDto } from './dto/update-documento-auto.dto';

@Injectable()
export class DocumentoAutoService {
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

  async create(autoId: string, dto: CreateDocumentoAutoDto) {
    await this.assertAutoEnOrganizacion(autoId);

    return this.prisma.documentoAuto.create({ data: { ...dto, autoId } });
  }

  async findAll(autoId: string) {
    await this.assertAutoEnOrganizacion(autoId);

    return this.prisma.documentoAuto.findMany({ where: { autoId } });
  }

  async findOne(autoId: string, id: string) {
    await this.assertAutoEnOrganizacion(autoId);

    const documento = await this.prisma.documentoAuto.findFirst({ where: { id, autoId } });
    if (!documento) {
      throw new NotFoundException('Documento no encontrado');
    }

    return documento;
  }

  async update(autoId: string, id: string, dto: UpdateDocumentoAutoDto) {
    await this.findOne(autoId, id);

    return this.prisma.documentoAuto.update({ where: { id }, data: dto });
  }

  async remove(autoId: string, id: string) {
    await this.findOne(autoId, id);
    await this.prisma.documentoAuto.delete({ where: { id } });
  }
}
