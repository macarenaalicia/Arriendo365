import { Module } from '@nestjs/common';
import { AutoService } from './auto.service';
import { AutoController } from './auto.controller';
import { DocumentoAutoService } from './documento-auto/documento-auto.service';
import { DocumentoAutoController } from './documento-auto/documento-auto.controller';
import { MantencionAutoService } from './mantencion-auto/mantencion-auto.service';
import { MantencionAutoController } from './mantencion-auto/mantencion-auto.controller';
import { PagoVehiculoService } from './pago-vehiculo/pago-vehiculo.service';
import { PagoVehiculoController } from './pago-vehiculo/pago-vehiculo.controller';
import { CobroAutoService } from './cobro-auto/cobro-auto.service';
import { CobroAutoController } from './cobro-auto/cobro-auto.controller';

@Module({
  controllers: [
    AutoController,
    DocumentoAutoController,
    MantencionAutoController,
    PagoVehiculoController,
    CobroAutoController,
  ],
  providers: [
    AutoService,
    DocumentoAutoService,
    MantencionAutoService,
    PagoVehiculoService,
    CobroAutoService,
  ],
})
export class AutoModule {}
