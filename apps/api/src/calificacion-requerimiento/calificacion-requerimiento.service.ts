import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCalificacionRequerimientoDto } from './dto/create-calificacion-requerimiento.dto';
import { UpdateCalificacionRequerimientoDto } from './dto/update-calificacion-requerimiento.dto';

@Injectable()
export class CalificacionRequerimientoService {
  constructor(private readonly prisma: PrismaService) {}

  create(dto: CreateCalificacionRequerimientoDto) {
    return this.prisma.calificacionRequerimiento.create({ data: dto });
  }

  findAll() {
    return this.prisma.calificacionRequerimiento.findMany({ orderBy: { nombre: 'asc' } });
  }

  async findOne(id: string) {
    const calificacion = await this.prisma.calificacionRequerimiento.findUnique({ where: { id } });
    if (!calificacion) {
      throw new NotFoundException('Calificación no encontrada');
    }
    return calificacion;
  }

  async update(id: string, dto: UpdateCalificacionRequerimientoDto) {
    await this.findOne(id);
    return this.prisma.calificacionRequerimiento.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.calificacionRequerimiento.delete({ where: { id } });
  }
}
