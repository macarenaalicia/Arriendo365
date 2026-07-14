import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { DocumentoService } from './documento.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { FindDocumentosDto } from './dto/find-documentos.dto';

@Controller('documentos')
export class DocumentoController {
  constructor(private readonly documentoService: DocumentoService) {}

  @Post()
  create(@Body() dto: CreateDocumentoDto) {
    return this.documentoService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindDocumentosDto) {
    return this.documentoService.findAll(query);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.documentoService.findOne(id);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.documentoService.remove(id);
  }
}
