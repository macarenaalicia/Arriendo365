import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { TenantContextService } from '../common/tenant/tenant-context.service';
import { ArriendoTipo } from '../pago/dto/create-pago.dto';
import { CreateChatMensajeDto } from './dto/create-chat-mensaje.dto';
import { FindChatMensajesDto } from './dto/find-chat-mensajes.dto';

@Injectable()
export class ChatService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly tenant: TenantContextService,
  ) {}

  private async assertArriendoEnOrganizacion(arriendoTipo: ArriendoTipo, arriendoId: string) {
    const organizacionId = this.tenant.organizacionId;

    const existe =
      arriendoTipo === 'propiedad'
        ? await this.prisma.arriendoPropiedad.findFirst({
            where: { id: arriendoId, propiedad: { organizacionId } },
          })
        : await this.prisma.arriendoAuto.findFirst({
            where: { id: arriendoId, auto: { organizacionId } },
          });

    if (!existe) {
      throw new NotFoundException('Arriendo no encontrado');
    }
  }

  private async assertPersonaEnOrganizacion(personaId: string) {
    const persona = await this.prisma.persona.findFirst({
      where: { id: personaId, organizacionId: this.tenant.organizacionId },
    });
    if (!persona) {
      throw new NotFoundException('Persona no encontrada');
    }
  }

  async create(dto: CreateChatMensajeDto) {
    await this.assertArriendoEnOrganizacion(dto.arriendoTipo, dto.arriendoId);
    await this.assertPersonaEnOrganizacion(dto.autorId);

    return this.prisma.chatMensaje.create({ data: dto, include: { autor: true } });
  }

  async findAll(query: FindChatMensajesDto) {
    await this.assertArriendoEnOrganizacion(query.arriendoTipo, query.arriendoId);

    return this.prisma.chatMensaje.findMany({
      where: { arriendoTipo: query.arriendoTipo, arriendoId: query.arriendoId },
      include: { autor: true },
      orderBy: { fecha: 'asc' },
    });
  }
}
