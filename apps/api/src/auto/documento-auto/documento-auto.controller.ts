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
import { DocumentoAutoService } from './documento-auto.service';
import { CreateDocumentoAutoDto } from './dto/create-documento-auto.dto';
import { UpdateDocumentoAutoDto } from './dto/update-documento-auto.dto';

@Controller('autos/:autoId/documentos')
export class DocumentoAutoController {
  constructor(private readonly documentoAutoService: DocumentoAutoService) {}

  @Post()
  create(@Param('autoId') autoId: string, @Body() dto: CreateDocumentoAutoDto) {
    return this.documentoAutoService.create(autoId, dto);
  }

  @Get()
  findAll(@Param('autoId') autoId: string) {
    return this.documentoAutoService.findAll(autoId);
  }

  @Get(':id')
  findOne(@Param('autoId') autoId: string, @Param('id') id: string) {
    return this.documentoAutoService.findOne(autoId, id);
  }

  @Patch(':id')
  update(
    @Param('autoId') autoId: string,
    @Param('id') id: string,
    @Body() dto: UpdateDocumentoAutoDto,
  ) {
    return this.documentoAutoService.update(autoId, id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('autoId') autoId: string, @Param('id') id: string) {
    return this.documentoAutoService.remove(autoId, id);
  }
}
