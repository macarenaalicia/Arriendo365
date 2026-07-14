import { PartialType } from '@nestjs/mapped-types';
import { CreatePagoVehiculoDto } from './create-pago-vehiculo.dto';

export class UpdatePagoVehiculoDto extends PartialType(CreatePagoVehiculoDto) {}
