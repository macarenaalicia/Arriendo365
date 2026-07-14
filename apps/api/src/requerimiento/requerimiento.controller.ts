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
import { RequerimientoService } from './requerimiento.service';
import { CreateRequerimientoDto } from './dto/create-requerimiento.dto';
import { UpdateRequerimientoDto } from './dto/update-requerimiento.dto';
import { FindRequerimientosDto } from './dto/find-requerimientos.dto';

@Controller('requerimientos')
export class RequerimientoController {
  constructor(private readonly requerimientoService: RequerimientoService) {}

  @Post()
  create(@Body() dto: CreateRequerimientoDto) {
    return this.requerimientoService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindRequerimientosDto) {
    return this.requerimientoService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.requerimientoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateRequerimientoDto) {
    return this.requerimientoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.requerimientoService.remove(id);
  }
}
