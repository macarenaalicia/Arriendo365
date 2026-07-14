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
  Query,
} from '@nestjs/common';
import { ArriendoPropiedadService } from './arriendo-propiedad.service';
import { CreateArriendoPropiedadDto } from './dto/create-arriendo-propiedad.dto';
import { UpdateArriendoPropiedadDto } from './dto/update-arriendo-propiedad.dto';
import { FindArriendosPropiedadDto } from './dto/find-arriendos-propiedad.dto';

@Controller('arriendos-propiedad')
export class ArriendoPropiedadController {
  constructor(private readonly arriendoPropiedadService: ArriendoPropiedadService) {}

  @Post()
  create(@Body() dto: CreateArriendoPropiedadDto) {
    return this.arriendoPropiedadService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindArriendosPropiedadDto) {
    return this.arriendoPropiedadService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.arriendoPropiedadService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArriendoPropiedadDto) {
    return this.arriendoPropiedadService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.arriendoPropiedadService.remove(id);
  }
}
