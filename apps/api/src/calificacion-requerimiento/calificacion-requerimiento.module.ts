import { Module } from '@nestjs/common';
import { CalificacionRequerimientoService } from './calificacion-requerimiento.service';
import { CalificacionRequerimientoController } from './calificacion-requerimiento.controller';

@Module({
  controllers: [CalificacionRequerimientoController],
  providers: [CalificacionRequerimientoService],
})
export class CalificacionRequerimientoModule {}
