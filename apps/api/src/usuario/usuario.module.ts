import { Module } from '@nestjs/common';
import { UsuarioService } from './usuario.service';
import { UsuarioController } from './usuario.controller';
import { AdministradorBienModule } from '../administrador-bien/administrador-bien.module';

@Module({
  imports: [AdministradorBienModule],
  controllers: [UsuarioController],
  providers: [UsuarioService],
})
export class UsuarioModule {}
