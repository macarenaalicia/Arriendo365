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
import { AutoService } from './auto.service';
import { CreateAutoDto } from './dto/create-auto.dto';
import { UpdateAutoDto } from './dto/update-auto.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
@Controller('autos')
export class AutoController {
  constructor(private readonly autoService: AutoService) {}

  @Post()
  create(@Body() dto: CreateAutoDto) {
    return this.autoService.create(dto);
  }

  @Get()
  findAll() {
    return this.autoService.findAll();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.autoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateAutoDto) {
    return this.autoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.autoService.remove(id);
  }
}
