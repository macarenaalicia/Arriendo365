import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD, APP_INTERCEPTOR } from '@nestjs/core';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { PrismaModule } from './prisma/prisma.module';
import { TenantModule } from './common/tenant/tenant.module';
import { TenancyInterceptor } from './common/tenant/tenancy.interceptor';
import { AuthModule } from './auth/auth.module';
import { JwtAuthGuard } from './auth/guards/jwt-auth.guard';
import { RolesGuard } from './common/guards/roles.guard';
import { PropiedadModule } from './propiedad/propiedad.module';
import { ProveedorModule } from './proveedor/proveedor.module';
import { PersonaModule } from './persona/persona.module';
import { ArriendoPropiedadModule } from './arriendo-propiedad/arriendo-propiedad.module';
import { PagoModule } from './pago/pago.module';
import { RequerimientoModule } from './requerimiento/requerimiento.module';
import { AutoModule } from './auto/auto.module';
import { ConfiguracionMantencionModule } from './configuracion-mantencion/configuracion-mantencion.module';
import { ArriendoAutoModule } from './arriendo-auto/arriendo-auto.module';
import { StorageModule } from './storage/storage.module';
import { DocumentoModule } from './documento/documento.module';
import { FotoModule } from './foto/foto.module';
import { ChatModule } from './chat/chat.module';
import { UsuarioModule } from './usuario/usuario.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    TenantModule,
    AuthModule,
    PropiedadModule,
    ProveedorModule,
    PersonaModule,
    ArriendoPropiedadModule,
    PagoModule,
    RequerimientoModule,
    AutoModule,
    ConfiguracionMantencionModule,
    ArriendoAutoModule,
    StorageModule,
    DocumentoModule,
    FotoModule,
    ChatModule,
    UsuarioModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
    { provide: APP_GUARD, useClass: RolesGuard },
    { provide: APP_INTERCEPTOR, useClass: TenancyInterceptor },
  ],
})
export class AppModule {}
