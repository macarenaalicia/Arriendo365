import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { AdministradorBienService } from '../administrador-bien/administrador-bien.service';
import { CreateCuentaBancariaDto } from './dto/create-cuenta-bancaria.dto';
import { UpdateCuentaBancariaDto } from './dto/update-cuenta-bancaria.dto';

@Injectable()
export class CuentaBancariaService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
    private readonly administradorBien: AdministradorBienService,
  ) {}

  async create(dto: CreateCuentaBancariaDto) {
    await this.administradorBien.assertAccesoCompleto();
    return this.prisma.cuentaBancaria.create({
      data: { ...dto, organizacionId: this.tenant.organizacionId },
    });
  }

  async findAll() {
    await this.administradorBien.assertAccesoCompleto();
    return this.prisma.cuentaBancaria.findMany({
      where: { organizacionId: this.tenant.organizacionId },
      orderBy: { alias: 'asc' },
    });
  }

  async findOne(id: string) {
    await this.administradorBien.assertAccesoCompleto();
    const cuenta = await this.prisma.cuentaBancaria.findFirst({
      where: { id, organizacionId: this.tenant.organizacionId },
    });
    if (!cuenta) {
      throw new NotFoundException('Cuenta bancaria no encontrada');
    }
    return cuenta;
  }

  async update(id: string, dto: UpdateCuentaBancariaDto) {
    await this.findOne(id);
    return this.prisma.cuentaBancaria.update({ where: { id }, data: dto });
  }

  async remove(id: string) {
    await this.findOne(id);
    await this.prisma.$transaction([
      this.prisma.arriendoPropiedad.updateMany({
        where: { cuentaBancariaId: id },
        data: { cuentaBancariaId: null },
      }),
      this.prisma.arriendoAuto.updateMany({
        where: { cuentaBancariaId: id },
        data: { cuentaBancariaId: null },
      }),
      this.prisma.cuentaBancaria.delete({ where: { id } }),
    ]);
  }
}
