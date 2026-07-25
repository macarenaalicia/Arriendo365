import { Module } from '@nestjs/common';
import { ArriendoAutoService } from './arriendo-auto.service';
import { ArriendoAutoController } from './arriendo-auto.controller';
import { AdministradorBienModule } from '../administrador-bien/administrador-bien.module';

@Module({
  imports: [AdministradorBienModule],
  controllers: [ArriendoAutoController],
  providers: [ArriendoAutoService],
})
export class ArriendoAutoModule {}
