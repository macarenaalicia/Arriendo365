import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateConfiguracionMantencionDto } from './dto/create-configuracion-mantencion.dto';
import { UpdateConfiguracionMantencionDto } from './dto/update-configuracion-mantencion.dto';

@Injectable()
export class ConfiguracionMantencionService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateConfiguracionMantencionDto) {
    return this.prisma.configuracionMantencion.create({ data: dto });
  }

  findAll() {
    return this.prisma.configuracionMantencion.findMany({ orderBy: { tipo: 'asc' } });
  }

  async findOne(id: string) {
    const configuracion = await this.prisma.configuracionMantencion.findUnique({ where: { id } });
    if (!configuracion) {
      throw new NotFoundException('Configuración de mantención no encontrada');
    }
    return configuracion;
  }

  async update(id: string, dto: UpdateConfiguracionMantencionDto) {
    await this.findOne(id);
    return this.prisma.configuracionMantencion.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.configuracionMantencion.delete({ where: { id } });
  }
}
