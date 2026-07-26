import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Patch,
  Post,
} from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { PersonaService } from './persona.service';
import { CreatePersonaDto } from './dto/create-persona.dto';
import { UpdatePersonaDto } from './dto/update-persona.dto';
import { Roles } from '../common/decorators/roles.decorator';

// GET queda abierto a TECNICO y a un administrador acotado a bienes: lo
// necesitan para elegir arrendatario/codeudor al crear un arriendo, o para
// asignar un técnico a un requerimiento. Crear/editar/eliminar personas (y
// por lo tanto gestionar sus accesos) sí queda limitado más abajo.
@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
@Controller('personas')
export class PersonaController {
  constructor(private readonly personaService: PersonaService) {}

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO)
  @Post()
  create(@Body() dto: CreatePersonaDto) {
    return this.personaService.create(dto);
  }

  @Get()
  findAll() {
    return this.personaService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.personaService.findOne(id);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO)
  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePersonaDto) {
    return this.personaService.update(id, dto);
  }

  @Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO)
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.personaService.remove(id);
  }
}
