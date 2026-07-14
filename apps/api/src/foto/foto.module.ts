import { Module } from '@nestjs/common';
import { EntidadModule } from '../common/entidad/entidad.module';
import { FotoService } from './foto.service';
import { FotoController } from './foto.controller';

@Module({
  imports: [EntidadModule],
  controllers: [FotoController],
  providers: [FotoService],
})
export class FotoModule {}
