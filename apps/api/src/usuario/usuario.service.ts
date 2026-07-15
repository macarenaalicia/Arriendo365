import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { CreateUsuarioDto } from './dto/create-usuario.dto';
import { UpdateUsuarioDto } from './dto/update-usuario.dto';

const SALT_ROUNDS = 10;

const SELECT_SIN_PASSWORD = {
  id: true,
  organizacionId: true,
  personaId: true,
  rol: true,
  activo: true,
  createdAt: true,
  updatedAt: true,
  persona: {
    select: { id: true, nombreCompleto: true, rut: true, email: true },
  },
} as const;

@Injectable()
export class UsuarioService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  private async assertPersonaEnOrganizacion(personaId: string) {
    const persona = await this.prisma.persona.findFirst({
      where: { id: personaId, organizacionId: this.tenant.organizacionId },
    });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }
  }

  async create(dto: CreateUsuarioDto) {
    await this.assertPersonaEnOrganizacion(dto.personaId);

    const existente = await this.prisma.usuario.findFirst({
      where: { personaId: dto.personaId, organizacionId: this.tenant.organizacionId },
    });
    if (existente) {
      throw new ConflictException('Esta persona ya tiene una cuenta de usuario');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    return this.prisma.usuario.create({
      data: {
        organizacionId: this.tenant.organizacionId,
        personaId: dto.personaId,
        rol: dto.rol,
        passwordHash,
      },
      select: SELECT_SIN_PASSWORD,
    });
  }

  findAll() {
    return this.prisma.usuario.findMany({
      where: { organizacionId: this.tenant.organizacionId },
      select: SELECT_SIN_PASSWORD,
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string) {
    const usuario = await this.prisma.usuario.findFirst({
      where: { id, organizacionId: this.tenant.organizacionId },
      select: SELECT_SIN_PASSWORD,
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }
    return usuario;
  }

  async update(id: string, dto: UpdateUsuarioDto) {
    await this.findOne(id);

    const { password, ...resto } = dto;

    return this.prisma.usuario.update({
      where: { id },
      data: {
        ...resto,
        passwordHash: password ? await bcrypt.hash(password, SALT_ROUNDS) : undefined,
      },
      select: SELECT_SIN_PASSWORD,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.usuario.delete({ where: { id } });
  }
}
