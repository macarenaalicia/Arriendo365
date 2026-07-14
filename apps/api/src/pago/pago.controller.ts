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
import { PagoService } from './pago.service';
import { CreatePagoDto } from './dto/create-pago.dto';
import { UpdatePagoDto } from './dto/update-pago.dto';
import { FindPagosDto } from './dto/find-pagos.dto';

@Controller('pagos')
export class PagoController {
  constructor(private readonly pagoService: PagoService) {}

  @Post()
  create(@Body() dto: CreatePagoDto) {
    return this.pagoService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindPagosDto) {
    return this.pagoService.findAll(query);
  }

  @Get('resumen')
  resumen() {
    return this.pagoService.resumen();
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.pagoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdatePagoDto) {
    return this.pagoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.pagoService.remove(id);
  }
}
