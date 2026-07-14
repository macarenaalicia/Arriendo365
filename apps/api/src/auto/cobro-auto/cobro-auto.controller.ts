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
import { CobroAutoService } from './cobro-auto.service';
import { CreateCobroAutoDto } from './dto/create-cobro-auto.dto';
import { UpdateCobroAutoDto } from './dto/update-cobro-auto.dto';

@Controller('autos/:autoId/cobros')
export class CobroAutoController {
  constructor(private readonly cobroAutoService: CobroAutoService) {}

  @Post()
  create(@Param('autoId') autoId: string, @Body() dto: CreateCobroAutoDto) {
    return this.cobroAutoService.create(autoId, dto);
  }

  @Get()
  findAll(@Param('autoId') autoId: string) {
    return this.cobroAutoService.findAll(autoId);
  }

  @Get(':id')
  findOne(@Param('autoId') autoId: string, @Param('id') id: string) {
    return this.cobroAutoService.findOne(autoId, id);
  }

  @Patch(':id')
  update(
    @Param('autoId') autoId: string,
    @Param('id') id: string,
    @Body() dto: UpdateCobroAutoDto,
  ) {
    return this.cobroAutoService.update(autoId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('autoId') autoId: string, @Param('id') id: string) {
    return this.cobroAutoService.remove(autoId, id);
  }
}
