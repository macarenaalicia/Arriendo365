import { Module } from '@nestjs/common';
import { EntidadModule } from '../common/entidad/entidad.module';
import { DocumentoService } from './documento.service';
import { DocumentoController } from './documento.controller';

@Module({
  imports: [EntidadModule],
  controllers: [DocumentoController],
  providers: [DocumentoService],
})
export class DocumentoModule {}
