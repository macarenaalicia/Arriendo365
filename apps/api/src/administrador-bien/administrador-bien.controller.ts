import { Body, Controller, Get, Param, Put } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { AdministradorBienService } from './administrador-bien.service';
import { AsignarBienesDto } from './dto/asignar-bienes.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR)
@Controller('usuarios/:usuarioId/bienes')
export class AdministradorBienController {
  constructor(private readonly administradorBienService: AdministradorBienService) {}

  @Get()
  listar(@Param('usuarioId') usuarioId: string) {
    return this.administradorBienService.listarPorUsuario(usuarioId);
  }

  @Put()
  asignar(@Param('usuarioId') usuarioId: string, @Body() dto: AsignarBienesDto) {
    return this.administradorBienService.asignar(usuarioId, dto);
  }
}
