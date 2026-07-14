import { Body, Controller, Post } from '@nestjs/common';
import { R2Service } from './r2.service';
import { CrearUrlSubidaDto } from './dto/crear-url-subida.dto';

@Controller('storage')
export class StorageController {
  constructor(private readonly r2Service: R2Service) {}

  @Post('presigned-upload')
  crearUrlSubida(@Body() dto: CrearUrlSubidaDto) {
    return this.r2Service.crearUrlSubida(dto.carpeta, dto.nombreArchivo, dto.contentType);
  }
}
