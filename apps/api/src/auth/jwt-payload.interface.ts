import { RolUsuario } from '@prisma/client';
import { Request } from 'express';

export interface JwtPayload {
  sub: string;
  organizacionId: string;
  personaId: string;
  rol: RolUsuario;
  nombreCompleto: string;
}

export interface AuthenticatedRequest extends Request {
  user: JwtPayload;
}
