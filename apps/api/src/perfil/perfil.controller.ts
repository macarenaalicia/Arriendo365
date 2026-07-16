import { Body, Controller, Get, HttpCode, HttpStatus, Patch } from '@nestjs/common';
import { PerfilService } from './perfil.service';
import { CambiarPasswordDto } from './dto/cambiar-password.dto';
import { ActualizarPerfilDto } from './dto/actualizar-perfil.dto';

@Controller('perfil')
export class PerfilController {
  constructor(private readonly perfilService: PerfilService) {}

  @Get()
  obtenerPerfil() {
    return this.perfilService.obtenerPerfil();
  }

  @Patch()
  actualizarPerfil(@Body() dto: ActualizarPerfilDto) {
    return this.perfilService.actualizarPerfil(dto);
  }

  @Patch('password')
  @HttpCode(HttpStatus.NO_CONTENT)
  cambiarPassword(@Body() dto: CambiarPasswordDto) {
    return this.perfilService.cambiarPassword(dto);
  }
}
