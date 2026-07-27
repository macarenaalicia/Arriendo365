import { Module } from '@nestjs/common';
import { CuentaBancariaService } from './cuenta-bancaria.service';
import { CuentaBancariaController } from './cuenta-bancaria.controller';
import { AdministradorBienModule } from '../administrador-bien/administrador-bien.module';

@Module({
  imports: [AdministradorBienModule],
  controllers: [CuentaBancariaController],
  providers: [CuentaBancariaService],
})
export class CuentaBancariaModule {}
