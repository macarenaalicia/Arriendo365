import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { TenantContextService } from '../../common/tenant/tenant-context.service';
import { CreateCobroAutoDto } from './dto/create-cobro-auto.dto';
import { UpdateCobroAutoDto } from './dto/update-cobro-auto.dto';

@Injectable()
export class CobroAutoService {
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

  async create(autoId: string, dto: CreateCobroAutoDto) {
    await this.assertAutoEnOrganizacion(autoId);

    return this.prisma.cobroAuto.create({ data: { ...dto, autoId } });
  }

  async findAll(autoId: string) {
    await this.assertAutoEnOrganizacion(autoId);

    return this.prisma.cobroAuto.findMany({ where: { autoId } });
  }

  async findOne(autoId: string, id: string) {
    await this.assertAutoEnOrganizacion(autoId);

    const cobro = await this.prisma.cobroAuto.findFirst({ where: { id, autoId } });
    if (!cobro) {
      throw new NotFoundException('Cobro no encontrado');
    }

    return cobro;
  }

  async update(autoId: string, id: string, dto: UpdateCobroAutoDto) {
    await this.findOne(autoId, id);

    return this.prisma.cobroAuto.update({ where: { id }, data: dto });
  }

  async remove(autoId: string, id: string) {
    await this.findOne(autoId, id);
    await this.prisma.cobroAuto.delete({ where: { id } });
  }
}
