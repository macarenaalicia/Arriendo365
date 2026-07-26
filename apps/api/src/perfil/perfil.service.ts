import { Injectable, NotFoundException, UnauthorizedException } from '@nestjs/common';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { AdministradorBienService } from '../administrador-bien/administrador-bien.service';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';

const SALT_ROUNDS = 10;

@Injectable()
export class PerfilService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
    private readonly administradorBien: AdministradorBienService,
  ) {}

  async obtenerPerfil() {
    const persona = await this.prisma.persona.findUnique({
      where: { id: this.tenant.personaId },
    });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: this.tenant.usuarioId },
      select: { debeCambiarPassword: true },
    });
    const { propiedadIds, autoIds } = await this.administradorBien.getFiltroBienesUsuarioActual();

    return {
      nombreCompleto: persona.nombreCompleto,
      rut: persona.rut,
      email: persona.email,
      telefono: persona.telefono,
      rol: this.tenant.rol,
      debeCambiarPassword: usuario?.debeCambiarPassword ?? false,
      // Un administrador acotado a bienes puntuales no debe ver Personas ni
      // Usuarios (esa vista abarca toda la organización) — el frontend usa
      // esto para ocultar el link de navegación y las acciones asociadas.
      bienesRestringidos: propiedadIds !== null || autoIds !== null,
    };
  }

  async actualizarPerfil(dto: ActualizarPerfilDto) {
    const persona = await this.prisma.persona.update({
      where: { id: this.tenant.personaId },
      data: dto,
    });

    return {
      nombreCompleto: persona.nombreCompleto,
      rut: persona.rut,
      email: persona.email,
      telefono: persona.telefono,
      rol: this.tenant.rol,
    };
  }

  async cambiarPassword(dto: CambiarPasswordDto) {
    const usuario = await this.prisma.usuario.findUnique({
      where: { id: this.tenant.usuarioId },
    });
    if (!usuario) {
      throw new NotFoundException('Usuario no encontrado');
    }

    const valida = await bcrypt.compare(dto.passwordActual, usuario.passwordHash);
    if (!valida) {
      throw new UnauthorizedException('La contraseña actual no es correcta');
    }

    const passwordHash = await bcrypt.hash(dto.passwordNueva, SALT_ROUNDS);
    await this.prisma.usuario.update({
      where: { id: usuario.id },
      data: { passwordHash, debeCambiarPassword: false },
    });
  }
}
