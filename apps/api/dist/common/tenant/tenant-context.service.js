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
exports.TenantContextService = void 0;
const common_1 = require("@nestjs/common");
const nestjs_cls_1 = require("nestjs-cls");
let TenantContextService = class TenantContextService {
    cls;
    constructor(cls) {
        this.cls = cls;
    }
    set(store) {
        this.cls.set('organizacionId', store.organizacionId);
        this.cls.set('usuarioId', store.usuarioId);
        this.cls.set('personaId', store.personaId);
        this.cls.set('rol', store.rol);
    }
    get organizacionId() {
        return this.cls.get('organizacionId');
    }
    get usuarioId() {
        return this.cls.get('usuarioId');
    }
    get personaId() {
        return this.cls.get('personaId');
    }
    get rol() {
        return this.cls.get('rol');
    }
};
exports.TenantContextService = TenantContextService;
exports.TenantContextService = TenantContextService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [nestjs_cls_1.ClsService])
], TenantContextService);
//# sourceMappingURL=tenant-context.service.js.map