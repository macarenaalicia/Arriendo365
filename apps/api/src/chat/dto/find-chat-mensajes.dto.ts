import { IsIn, IsUUID } from 'class-validator';
import { ARRIENDO_TIPOS, type ArriendoTipo } from '../../pago/dto/create-pago.dto';

export class FindChatMensajesDto {
  @IsIn(ARRIENDO_TIPOS)
  arriendoTipo: ArriendoTipo;

  @IsUUID()
  arriendoId: string;
}
