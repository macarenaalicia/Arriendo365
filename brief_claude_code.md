# Brief para Claude Code — Arriendo365

## 0. Nombre del proyecto

**Arriendo365** — software de administración de arriendos (propiedades y vehículos), multi-tenant.

## 1. Contexto del proyecto

Software de administración de arriendos (propiedades y vehículos). Nace para que una sola persona (un propietario) administre sus arriendos, pero está diseñado **multi-tenant desde el día uno**: cualquier usuario podrá crear su propia organización y gestionar su propia cartera, sin ver datos de otras organizaciones.

La entidad central del sistema es el **Arriendo** (contrato activo), no la Propiedad ni el Auto — la pantalla principal debe ser "lista de arriendos activos", desde donde se navega a la propiedad/auto, el arrendatario, los pagos y los requerimientos asociados.

## 2. Stack definido

| Capa | Tecnología |
|---|---|
| Backend | NestJS + TypeScript |
| ORM | Prisma (ver `schema.prisma` adjunto) |
| Base de datos | PostgreSQL — local con Docker, producción en Neon |
| Multi-tenancy | `nestjs-cls` + interceptor/guard que inyecta `organizacionId` desde el JWT en cada request |
| Autenticación | Passport.js + JWT (`@nestjs/passport`, `@nestjs/jwt`) |
| Roles | Administrador, Propietario, Arrendatario, Técnico |
| Frontend | React + TypeScript (Vite) |
| Almacenamiento de archivos | Cloudflare R2 (compatible con SDK de S3) — fotos y documentos, solo se guarda la URL en Postgres |
| Trabajos en segundo plano | BullMQ + Redis (Upstash en producción) |
| Email | Resend |
| Hosting | Render (backend) + Vercel (frontend) + Neon (DB) |

## 3. Archivos adjuntos en este mismo directorio

- `schema.prisma` — esquema completo de base de datos, con todas las entidades, enums y relaciones.
- `docker-compose.yml` — levanta Postgres local en el puerto 5432.
- `.env.example` — variables de entorno necesarias (copiar a `.env` y completar).

## 4. Nota importante sobre relaciones polimórficas

Las tablas `documento`, `foto`, `pago` y `chat_mensaje` usan un patrón de `entidadTipo` + `entidadId` (o `arriendoTipo` + `arriendoId`) para poder referenciar distintas entidades padre (ej. un Pago puede pertenecer a un ArriendoPropiedad o a un ArriendoAuto). **Esto no tiene relación formal en Prisma** — no hay integridad referencial a nivel de base de datos. La validación de que el `entidadId`/`arriendoId` referenciado existe y pertenece a la organización correcta debe hacerse en la capa de servicio (NestJS), no se puede delegar al ORM.

## 5. Estructura de carpetas sugerida

Repositorio raíz: `arriendo365/`

```
arriendo365/
  /apps
    /api        → proyecto NestJS
    /web        → proyecto React (Vite)
  /packages
    /shared-types → (opcional) DTOs/tipos compartidos entre api y web
```

## 6. Orden de desarrollo sugerido (por prioridad de MVP)

1. **Auth + Organización + Usuario** — login, JWT, guard de multi-tenancy.
2. **Propiedad + Proveedor** — catálogo base.
3. **Persona + ArriendoPropiedad** — crear arriendos, ver detalle.
4. **Pago** — registrar mensualidades, vista de resumen de pagos.
5. **Requerimiento + Gasto** — mantenimiento y reparaciones.
6. **Auto + ArriendoAuto + Mantención + ConfiguracionMantencion**.
7. **PagoVehiculo + CobroAuto**.
8. **Documento + Foto** — subida de archivos a Cloudflare R2.
9. **Chat** entre arrendatario y administrador.
10. **Frontend**: pantallas de Login, Lista de arriendos, Detalle de arriendo, Resumen de pagos.

## 7. Primer prompt sugerido para Claude Code

```
Lee schema.prisma, docker-compose.yml, .env.example y este brief completo.

Quiero que armes un monorepo con:
- apps/api: proyecto NestJS con Prisma ya configurado usando el schema.prisma adjunto
- apps/web: proyecto React + Vite + TypeScript, vacío por ahora

Para apps/api:
1. Configura Prisma con el schema.prisma adjunto y genera la migración inicial
   contra Postgres local (docker-compose.yml ya define el servicio).
2. Crea el módulo de autenticación (Organizacion, Usuario, login con JWT).
3. Crea el interceptor/guard de multi-tenancy usando nestjs-cls que inyecte
   organizacionId del JWT en el contexto de cada request.
4. Crea el módulo de Propiedad y Proveedor con CRUD básico, respetando el
   filtro de organizacionId en todas las queries.

No avances a los módulos de Persona/Arriendo todavía — quiero revisar que
la base (auth + multi-tenancy + Propiedad) funcione correctamente primero.
```

## 8. Referencia completa del modelo de datos

Para el detalle funcional de cada módulo (qué campos significan qué, las vistas propuestas, y el razonamiento detrás de cada decisión de diseño), usar el documento `modelo_datos_software_arriendo365.md` generado previamente junto con este brief.
