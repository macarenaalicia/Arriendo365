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
var __param = (this && this.__param) || function (paramIndex, decorator) {
    return function (target, key) { decorator(target, key, paramIndex); }
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ProveedorController = void 0;
const common_1 = require("@nestjs/common");
const proveedor_service_1 = require("./proveedor.service");
const create_proveedor_dto_1 = require("./dto/create-proveedor.dto");
const update_proveedor_dto_1 = require("./dto/update-proveedor.dto");
let ProveedorController = class ProveedorController {
    proveedorService;
    constructor(proveedorService) {
        this.proveedorService = proveedorService;
    }
    create(propiedadId, dto) {
        return this.proveedorService.create(propiedadId, dto);
    }
    findAll(propiedadId) {
        return this.proveedorService.findAll(propiedadId);
    }
    findOne(propiedadId, id) {
        return this.proveedorService.findOne(propiedadId, id);
    }
    update(propiedadId, id, dto) {
        return this.proveedorService.update(propiedadId, id, dto);
    }
    remove(propiedadId, id) {
        return this.proveedorService.remove(propiedadId, id);
    }
};
exports.ProveedorController = ProveedorController;
__decorate([
    (0, common_1.Post)(),
    __param(0, (0, common_1.Param)('propiedadId')),
    __param(1, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, create_proveedor_dto_1.CreateProveedorDto]),
    __metadata("design:returntype", void 0)
], ProveedorController.prototype, "create", null);
__decorate([
    (0, common_1.Get)(),
    __param(0, (0, common_1.Param)('propiedadId')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String]),
    __metadata("design:returntype", void 0)
], ProveedorController.prototype, "findAll", null);
__decorate([
    (0, common_1.Get)(':id'),
    __param(0, (0, common_1.Param)('propiedadId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProveedorController.prototype, "findOne", null);
__decorate([
    (0, common_1.Patch)(':id'),
    __param(0, (0, common_1.Param)('propiedadId')),
    __param(1, (0, common_1.Param)('id')),
    __param(2, (0, common_1.Body)()),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String, update_proveedor_dto_1.UpdateProveedorDto]),
    __metadata("design:returntype", void 0)
], ProveedorController.prototype, "update", null);
__decorate([
    (0, common_1.Delete)(':id'),
    (0, common_1.HttpCode)(common_1.HttpStatus.NO_CONTENT),
    __param(0, (0, common_1.Param)('propiedadId')),
    __param(1, (0, common_1.Param)('id')),
    __metadata("design:type", Function),
    __metadata("design:paramtypes", [String, String]),
    __metadata("design:returntype", void 0)
], ProveedorController.prototype, "remove", null);
exports.ProveedorController = ProveedorController = __decorate([
    (0, common_1.Controller)('propiedades/:propiedadId/proveedores'),
    __metadata("design:paramtypes", [proveedor_service_1.ProveedorService])
], ProveedorController);
//# sourceMappingURL=proveedor.controller.js.map