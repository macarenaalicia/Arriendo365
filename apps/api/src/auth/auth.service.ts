import { ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
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
    private readonly config: ConfigService,
  ) {}

  private esSuperAdmin(email: string): boolean {
    const superAdminEmail = this.config.get<string>('SUPER_ADMIN_EMAIL');
    return Boolean(superAdminEmail) && email.toLowerCase() === superAdminEmail!.toLowerCase();
  }

  async registrarOrganizacion(dto: RegistroOrganizacionDto) {
    const existente = await this.prisma.persona.findFirst({ where: { email: dto.email } });
    if (existente) {
      throw new ConflictException('Ya existe una cuenta con ese email');
    }

    const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);

    await this.prisma.$transaction(async (tx) => {
      // Nace PENDIENTE_APROBACION (default del esquema): no queda operativa
      // hasta que el dueño de la plataforma la apruebe desde el panel de
      // super-admin, momento en que arranca el trial de 7 días.
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

      await tx.usuario.create({
        data: {
          organizacionId: organizacion.id,
          personaId: persona.id,
          rol: RolUsuario.ADMINISTRADOR,
          passwordHash,
        },
      });
    });

    return {
      pendienteAprobacion: true,
      mensaje:
        'Tu solicitud fue recibida. Un administrador de la plataforma debe aprobarla antes de que puedas iniciar sesión.',
    };
  }

  async login(dto: LoginDto) {
    // Persona.email no tiene constraint unique a nivel de DB; se asume unicidad
    // de facto para login en el MVP.
    const persona = await this.prisma.persona.findFirst({
      where: { email: dto.email },
      include: { usuarios: { include: { organizacion: true } } },
    });

    const usuario = persona?.usuarios[0];
    if (!persona || !usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValida || !usuario.activo) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const organizacion = usuario.organizacion;
    if (organizacion.estado === 'PENDIENTE_APROBACION') {
      throw new ForbiddenException(
        'Tu organización aún no ha sido aprobada. Te avisaremos apenas quede activa.',
      );
    }
    if (organizacion.estado === 'RECHAZADA') {
      throw new ForbiddenException('Tu solicitud de registro fue rechazada.');
    }
    if (organizacion.vigenteHasta && organizacion.vigenteHasta.getTime() < Date.now()) {
      throw new ForbiddenException(
        'El período de prueba o suscripción de tu organización venció. Contáctanos para reactivarla.',
      );
    }

    return {
      ...this.emitirToken({
        sub: usuario.id,
        organizacionId: usuario.organizacionId,
        personaId: usuario.personaId,
        rol: usuario.rol,
        nombreCompleto: persona.nombreCompleto,
        esSuperAdmin: this.esSuperAdmin(persona.email ?? ''),
      }),
      debeCambiarPassword: usuario.debeCambiarPassword,
    };
  }

  private emitirToken(payload: JwtPayload) {
    return { accessToken: this.jwt.sign(payload) };
  }
}
