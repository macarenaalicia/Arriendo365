import { Module } from '@nestjs/common';
import { ArriendoPropiedadService } from './arriendo-propiedad.service';
import { ArriendoPropiedadController } from './arriendo-propiedad.controller';

@Module({
  controllers: [ArriendoPropiedadController],
  providers: [ArriendoPropiedadService],
})
export class ArriendoPropiedadModule {}
