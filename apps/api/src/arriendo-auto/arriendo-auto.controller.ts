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
import { ArriendoAutoService } from './arriendo-auto.service';
import { CreateArriendoAutoDto } from './dto/create-arriendo-auto.dto';
import { UpdateArriendoAutoDto } from './dto/update-arriendo-auto.dto';
import { FindArriendosAutoDto } from './dto/find-arriendos-auto.dto';

@Controller('arriendos-auto')
export class ArriendoAutoController {
  constructor(private readonly arriendoAutoService: ArriendoAutoService) {}

  @Post()
  create(@Body() dto: CreateArriendoAutoDto) {
    return this.arriendoAutoService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindArriendosAutoDto) {
    return this.arriendoAutoService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.arriendoAutoService.findOne(id);
  }

  @Patch(':id')
  update(@Param('id') id: string, @Body() dto: UpdateArriendoAutoDto) {
    return this.arriendoAutoService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.arriendoAutoService.remove(id);
  }
}
