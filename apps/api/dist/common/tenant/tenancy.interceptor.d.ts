import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Observable } from 'rxjs';
import { TenantContextService } from './tenant-context.service';
export declare class TenancyInterceptor implements NestInterceptor {
    private readonly tenant;
    constructor(tenant: TenantContextService);
    intercept(context: ExecutionContext, next: CallHandler): Observable<unknown>;
}
