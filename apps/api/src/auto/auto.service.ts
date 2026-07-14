import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CreateAutoDto } from './dto/create-auto.dto';
import { UpdateAutoDto } from './dto/update-auto.dto';

@Injectable()
export class AutoService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  async create(dto: CreateAutoDto) {
    const existente = await this.prisma.auto.findFirst({
      where: { organizacionId: this.tenant.organizacionId, patente: dto.patente },
    });
    if (existente) {
      throw new ConflictException('Ya existe un auto con esa patente en la organización');
    }

    return this.prisma.auto.create({
      data: { ...dto, organizacionId: this.tenant.organizacionId },
    });
  }

  findAll() {
    return this.prisma.auto.findMany({
      where: { organizacionId: this.tenant.organizacionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const auto = await this.prisma.auto.findFirst({
      where: { id, organizacionId: this.tenant.organizacionId },
      include: { documentos: true },
    });

    if (!auto) {
      throw new NotFoundException('Auto no encontrado');
    }

    return auto;
  }

  async update(id: string, dto: UpdateAutoDto) {
    await this.findOne(id);

    return this.prisma.auto.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.auto.delete({ where: { id } });
  }
}
