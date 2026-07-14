import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

@Injectable()
export class PersonaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  async create(dto: CreatePersonaDto) {
    const { recomendaciones, ...datos } = dto;

    const existente = await this.prisma.persona.findFirst({
      where: { organizacionId: this.tenant.organizacionId, rut: dto.rut },
    });
    if (existente) {
      throw new ConflictException('Ya existe una persona con ese RUT en la organización');
    }

    return this.prisma.persona.create({
      data: {
        ...datos,
        organizacionId: this.tenant.organizacionId,
        recomendaciones: recomendaciones ? { create: recomendaciones } : undefined,
      },
      include: { recomendaciones: true },
    });
  }

  findAll() {
    return this.prisma.persona.findMany({
      where: { organizacionId: this.tenant.organizacionId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const persona = await this.prisma.persona.findFirst({
      where: { id, organizacionId: this.tenant.organizacionId },
      include: { recomendaciones: true },
    });

    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }

    return persona;
  }

  async update(id: string, dto: UpdatePersonaDto) {
    await this.findOne(id);
    const { recomendaciones: _recomendaciones, ...datos } = dto;

    return this.prisma.persona.update({
      where: { id },
      data: datos,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.persona.delete({ where: { id } });
  }
}
