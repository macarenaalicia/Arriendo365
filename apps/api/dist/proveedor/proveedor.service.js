"use strict";
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProveedorService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_service_1 = require("../common/tenant/tenant-context.service");
let ProveedorService = class ProveedorService {
    prisma;
    tenant;
    constructor(prisma, tenant) {
        this.prisma = prisma;
        this.tenant = tenant;
    }
    async assertPropiedadEnOrganizacion(propiedadId) {
        const propiedad = await this.prisma.propiedad.findFirst({
            where: { id: propiedadId, organizacionId: this.tenant.organizacionId },
        });
        if (!propiedad) {
            throw new common_1.NotFoundException('Propiedad no encontrada');
        }
    }
    async create(propiedadId, dto) {
        await this.assertPropiedadEnOrganizacion(propiedadId);
        return this.prisma.proveedor.create({
            data: { ...dto, propiedadId },
        });
    }
    async findAll(propiedadId) {
        await this.assertPropiedadEnOrganizacion(propiedadId);
        return this.prisma.proveedor.findMany({ where: { propiedadId } });
    }
    async findOne(propiedadId, id) {
        await this.assertPropiedadEnOrganizacion(propiedadId);
        const proveedor = await this.prisma.proveedor.findFirst({
            where: { id, propiedadId },
        });
        if (!proveedor) {
            throw new common_1.NotFoundException('Proveedor no encontrado');
        }
        return proveedor;
    }
    async update(propiedadId, id, dto) {
        await this.findOne(propiedadId, id);
        return this.prisma.proveedor.update({
            where: { id },
            data: dto,
        });
    }
    async remove(propiedadId, id) {
        await this.findOne(propiedadId, id);
        await this.prisma.proveedor.delete({ where: { id } });
    }
};
exports.ProveedorService = ProveedorService;
exports.ProveedorService = ProveedorService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_service_1.TenantContextService])
], ProveedorService);
//# sourceMappingURL=proveedor.service.js.map