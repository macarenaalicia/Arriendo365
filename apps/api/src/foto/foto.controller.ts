import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { FotoService } from './foto.service';
import { CreateFotoDto } from './dto/create-foto.dto';
import { FindFotosDto } from './dto/find-fotos.dto';

@Controller('fotos')
export class FotoController {
  constructor(private readonly fotoService: FotoService) {}

  @Post()
  create(@Body() dto: CreateFotoDto) {
    return this.fotoService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindFotosDto) {
    return this.fotoService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.fotoService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.fotoService.remove(id);
  }
}
