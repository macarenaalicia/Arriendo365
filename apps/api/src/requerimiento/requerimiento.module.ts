import { Module } from '@nestjs/common';
import { RequerimientoService } from './requerimiento.service';
import { RequerimientoController } from './requerimiento.controller';
import { GastoService } from './gasto/gasto.service';
import { GastoController } from './gasto/gasto.controller';
import { MailModule } from '../mail/mail.module';

@Module({
  imports: [MailModule],
  controllers: [RequerimientoController, GastoController],
  providers: [RequerimientoService, GastoService],
})
export class RequerimientoModule {}
