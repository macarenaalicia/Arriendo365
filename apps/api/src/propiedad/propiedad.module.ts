import { Module } from '@nestjs/common';
import { PropiedadService } from './propiedad.service';
import { PropiedadController } from './propiedad.controller';
import { AdministradorBienModule } from '../administrador-bien/administrador-bien.module';

@Module({
  imports: [AdministradorBienModule],
  controllers: [PropiedadController],
  providers: [PropiedadService],
  exports: [PropiedadService],
})
export class PropiedadModule {}
