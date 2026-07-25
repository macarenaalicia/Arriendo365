import { Module } from '@nestjs/common';
import { ArriendoPropiedadService } from './arriendo-propiedad.service';
import { ArriendoPropiedadController } from './arriendo-propiedad.controller';
import { PdfModule } from '../pdf/pdf.module';
import { AdministradorBienModule } from '../administrador-bien/administrador-bien.module';

@Module({
  imports: [PdfModule, AdministradorBienModule],
  controllers: [ArriendoPropiedadController],
  providers: [ArriendoPropiedadService],
})
export class ArriendoPropiedadModule {}
