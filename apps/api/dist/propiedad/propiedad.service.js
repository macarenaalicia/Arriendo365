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
exports.PropiedadService = void 0;
const common_1 = require("@nestjs/common");
const prisma_service_1 = require("../prisma/prisma.service");
const tenant_context_service_1 = require("../common/tenant/tenant-context.service");
let PropiedadService = class PropiedadService {
    prisma;
    tenant;
    constructor(prisma, tenant) {
        this.prisma = prisma;
        this.tenant = tenant;
    }
    create(dto) {
        return this.prisma.propiedad.create({
            data: { ...dto, organizacionId: this.tenant.organizacionId },
        });
    }
    findAll() {
        return this.prisma.propiedad.findMany({
            where: { organizacionId: this.tenant.organizacionId },
            orderBy: { createdAt: 'desc' },
        });
    }
    async findOne(id) {
        const propiedad = await this.prisma.propiedad.findFirst({
            where: { id, organizacionId: this.tenant.organizacionId },
            include: { proveedores: true },
        });
        if (!propiedad) {
            throw new common_1.NotFoundException('Propiedad no encontrada');
        }
        return propiedad;
    }
    async update(id, dto) {
        await this.findOne(id);
        return this.prisma.propiedad.update({
            where: { id },
            data: dto,
        });
    }
    async remove(id) {
        await this.findOne(id);
        await this.prisma.propiedad.delete({ where: { id } });
    }
};
exports.PropiedadService = PropiedadService;
exports.PropiedadService = PropiedadService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        tenant_context_service_1.TenantContextService])
], PropiedadService);
//# sourceMappingURL=propiedad.service.js.map