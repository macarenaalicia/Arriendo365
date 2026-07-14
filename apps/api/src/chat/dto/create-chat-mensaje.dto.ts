import { IsIn, IsString, IsUUID } from 'class-validator';
import { ARRIENDO_TIPOS, type ArriendoTipo } from '../../pago/dto/create-pago.dto';

export class CreateChatMensajeDto {
  @IsIn(ARRIENDO_TIPOS)
  arriendoTipo: ArriendoTipo;

  @IsUUID()
  arriendoId: string;

  @IsUUID()
  autorId: string;

  @IsString()
  mensaje: string;
}
