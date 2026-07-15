import { Body, Controller, Delete, Get, HttpCode, HttpStatus, Param, Post, Query } from '@nestjs/common';
import { RolUsuario } from '@prisma/client';
import { DocumentoService } from './documento.service';
import { CreateDocumentoDto } from './dto/create-documento.dto';
import { FindDocumentosDto } from './dto/find-documentos.dto';
import { Roles } from '../common/decorators/roles.decorator';

@Roles(RolUsuario.ADMINISTRADOR, RolUsuario.PROPIETARIO, RolUsuario.TECNICO)
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
