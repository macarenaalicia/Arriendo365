import { Module } from '@nestjs/common';
import { PublicPropiedadesController } from './public-propiedades.controller';
import { PublicPropiedadesService } from './public-propiedades.service';

@Module({
  controllers: [PublicPropiedadesController],
  providers: [PublicPropiedadesService],
})
export class PublicPropiedadesModule {}
