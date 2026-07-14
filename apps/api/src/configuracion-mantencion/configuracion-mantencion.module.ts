import { Module } from '@nestjs/common';
import { ConfiguracionMantencionService } from './configuracion-mantencion.service';
import { ConfiguracionMantencionController } from './configuracion-mantencion.controller';

@Module({
  controllers: [ConfiguracionMantencionController],
  providers: [ConfiguracionMantencionService],
})
export class ConfiguracionMantencionModule {}
