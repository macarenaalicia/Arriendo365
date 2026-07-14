import { CallHandler, ExecutionContext, Injectable, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
import { AuthenticatedRequest } from '../../auth/jwt-payload.interface';

@Injectable()
export class TenancyInterceptor implements NestInterceptor {
  constructor(private readonly tenant: TenantContextService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const req = context.switchToHttp().getRequest<AuthenticatedRequest>();

    if (req.user) {
      this.tenant.set({
        organizacionId: req.user.organizacionId,
        usuarioId: req.user.sub,
        personaId: req.user.personaId,
        rol: req.user.rol,
      });
    }

    return next.handle();
  }
}
