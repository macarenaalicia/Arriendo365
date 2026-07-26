import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { RolUsuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { AdministradorBienService } from '../administrador-bien/administrador-bien.service';
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
    private readonly administradorBien: AdministradorBienService,
  ) {}

  async create(dto: CreatePersonaDto) {
    await this.administradorBien.assertAccesoCompleto();
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
    await this.administradorBien.assertAccesoCompleto();
    const actual = await this.findOne(id);
    const { recomendaciones: _recomendaciones, ...datos } = dto;
    const organizacionId = this.tenant.organizacionId;

    return this.prisma.$transaction(async (tx) => {
      const persona = await tx.persona.update({ where: { id }, data: datos });

      // El Perfil (tipoPersona) es lo que se elige acá; el Rol del Usuario
      // (permisos reales) vive aparte. Si cambia el perfil, el rol debe
      // reflejarlo — igual que ya pasa al crear la persona por primera vez.
      if (dto.tipoPersona && dto.tipoPersona !== actual.tipoPersona) {
        const usuario = await tx.usuario.findFirst({ where: { personaId: id } });
        const nuevoRolConAcceso = PERFILES_CON_ACCESO.includes(dto.tipoPersona as RolUsuario);

        if (usuario && nuevoRolConAcceso) {
          await tx.usuario.update({
            where: { id: usuario.id },
            data: { rol: dto.tipoPersona as RolUsuario },
          });
        } else if (!usuario && nuevoRolConAcceso) {
          const passwordHash = await bcrypt.hash(PASSWORD_INICIAL, SALT_ROUNDS);
          await tx.usuario.create({
            data: {
              organizacionId,
              personaId: id,
              rol: dto.tipoPersona as RolUsuario,
              passwordHash,
              debeCambiarPassword: true,
            },
          });
        }
      }

      return persona;
    });
  }

  async remove(id: string) {
    await this.administradorBien.assertAccesoCompleto();
    await this.findOne(id);

    const tieneArriendos = await this.prisma.arriendoPropiedad.findFirst({
      where: { OR: [{ arrendatarioId: id }, { codeudorId: id }] },
    });
    if (tieneArriendos) {
      throw new ConflictException(
        'No se puede eliminar una persona que tiene arriendos de propiedad registrados.',
      );
    }

    const tieneArriendosAuto = await this.prisma.arriendoAuto.findFirst({
      where: { arrendatarioId: id },
    });
    if (tieneArriendosAuto) {
      throw new ConflictException(
        'No se puede eliminar una persona que tiene arriendos de auto registrados.',
      );
    }

    await this.prisma.$transaction([
      this.prisma.personaRecomendacion.deleteMany({ where: { personaId: id } }),
      this.prisma.requerimiento.updateMany({ where: { tecnicoId: id }, data: { tecnicoId: null } }),
      this.prisma.requerimientoActualizacion.updateMany({
        where: { tecnicoId: id },
        data: { tecnicoId: null },
      }),
      this.prisma.usuario.deleteMany({ where: { personaId: id } }),
      this.prisma.persona.delete({ where: { id } }),
    ]);
  }
}
