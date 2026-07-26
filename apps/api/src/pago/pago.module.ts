import { Module } from '@nestjs/common';
import { PagoService } from './pago.service';
import { PagoController } from './pago.controller';
import { AdministradorBienModule } from '../administrador-bien/administrador-bien.module';

@Module({
  imports: [AdministradorBienModule],
  controllers: [PagoController],
  providers: [PagoService],
})
export class PagoModule {}
