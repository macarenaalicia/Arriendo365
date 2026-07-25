import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RolUsuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';

const SALT_ROUNDS = 10;
export const PASSWORD_INICIAL = '1234';

// Perfiles que corresponden a un uso real de la plataforma. TECNICO y
// CODEUDOR nunca reciben Usuario: el técnico solo necesita ser asignado a
// requerimientos, y el codeudor es solo un co-firmante del contrato.
const PERFILES_CON_ACCESO: RolUsuario[] = ['ADMINISTRADOR', 'PROPIETARIO', 'ARRENDATARIO'];

@Injectable()
export class PersonaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  async create(dto: CreatePersonaDto) {
    const { recomendaciones, ...datos } = dto;

    if (dto.rut) {
      const existente = await this.prisma.persona.findFirst({
        where: { organizacionId: this.tenant.organizacionId, rut: dto.rut },
      });
      if (existente) {
        throw new ConflictException('Ya existe una persona con ese RUT en la organización');
      }
    }

    const organizacionId = this.tenant.organizacionId;

    return this.prisma.$transaction(async (tx) => {
      const persona = await tx.persona.create({
        data: {
          ...datos,
          organizacionId,
          recomendaciones: recomendaciones ? { create: recomendaciones } : undefined,
        },
        include: { recomendaciones: true },
      });

      if (dto.tipoPersona && PERFILES_CON_ACCESO.includes(dto.tipoPersona as RolUsuario)) {
        const passwordHash = await bcrypt.hash(PASSWORD_INICIAL, SALT_ROUNDS);
        await tx.usuario.create({
          data: {
            organizacionId,
            personaId: persona.id,
            rol: dto.tipoPersona as RolUsuario,
            passwordHash,
            debeCambiarPassword: true,
          },
        });
      }

      return persona;
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
