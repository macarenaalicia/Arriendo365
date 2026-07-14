import { Module } from '@nestjs/common';
import { EntidadResolverService } from './entidad-resolver.service';

@Module({
  providers: [EntidadResolverService],
  exports: [EntidadResolverService],
})
export class EntidadModule {}
