import { ConflictException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { RolUsuario } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { RegistroOrganizacionDto } from './dto/registro-organizacion.dto';
import { LoginDto } from './dto/login.dto';
import { JwtPayload } from './jwt-payload.interface';

const SALT_ROUNDS = 10;

@Injectable()
export class AuthService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly jwt: JwtService,
  ) {}

  async registrarOrganizacion(dto: RegistroOrganizacionDto) {
    const existente = await this.prisma.persona.findFirst({ where: { email: dto.email } });
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    const { organizacion, usuario } = await this.prisma.$transaction(async (tx) => {
      const organizacion = await tx.organizacion.create({
        data: { nombre: dto.nombreOrganizacion },
      });

      const persona = await tx.persona.create({
        data: {
          organizacionId: organizacion.id,
          nombreCompleto: dto.nombreCompleto,
          rut: dto.rut,
          email: dto.email,
        },
      });

      const usuario = await tx.usuario.create({
        data: {
          organizacionId: organizacion.id,
          personaId: persona.id,
          rol: RolUsuario.ADMINISTRADOR,
          passwordHash,
        },
      });

      return { organizacion, usuario };
    });

    return this.emitirToken({
      sub: usuario.id,
      organizacionId: organizacion.id,
      personaId: usuario.personaId,
      rol: usuario.rol,
      nombreCompleto: dto.nombreCompleto,
    });
  }

  async login(dto: LoginDto) {
    // Persona.email no tiene constraint unique a nivel de DB; se asume unicidad
    // de facto para login en el MVP.
    const persona = await this.prisma.persona.findFirst({
      where: { email: dto.email },
      include: { usuarios: true },
    });

    const usuario = persona?.usuarios[0];
    if (!persona || !usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValida || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    return this.emitirToken({
      sub: usuario.id,
      organizacionId: usuario.organizacionId,
      personaId: usuario.personaId,
      rol: usuario.rol,
      nombreCompleto: persona.nombreCompleto,
    });
  }

  private emitirToken(payload: JwtPayload) {
    return { accessToken: this.jwt.sign(payload) };
  }
}
