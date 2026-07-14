import { Module } from '@nestjs/common';
import { ArriendoAutoService } from './arriendo-auto.service';
import { ArriendoAutoController } from './arriendo-auto.controller';

@Module({
  controllers: [ArriendoAutoController],
  providers: [ArriendoAutoService],
})
export class ArriendoAutoModule {}
