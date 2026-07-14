import { Body, Controller, Get, Post, Query } from '@nestjs/common';
import { ChatService } from './chat.service';
import { CreateChatMensajeDto } from './dto/create-chat-mensaje.dto';
import { FindChatMensajesDto } from './dto/find-chat-mensajes.dto';

@Controller('chat')
export class ChatController {
  constructor(private readonly chatService: ChatService) {}

  @Post()
  create(@Body() dto: CreateChatMensajeDto) {
    return this.chatService.create(dto);
  }

  @Get()
  findAll(@Query() query: FindChatMensajesDto) {
    return this.chatService.findAll(query);
  }
}
