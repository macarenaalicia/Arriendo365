import { Module } from '@nestjs/common';
import { AdministradorBienService } from './administrador-bien.service';
import { AdministradorBienController } from './administrador-bien.controller';

@Module({
  controllers: [AdministradorBienController],
  providers: [AdministradorBienService],
  exports: [AdministradorBienService],
})
export class AdministradorBienModule {}
