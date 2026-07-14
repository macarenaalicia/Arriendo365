"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
    var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
    if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
    else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
    return c > 3 && r && Object.defineProperty(target, key, r), r;
};
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __metadata = (this && this.__metadata) || function (k, v) {
    if (typeof Reflect === "object" && typeof Reflect.metadata === "function") return Reflect.metadata(k, v);
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AuthService = void 0;
const common_1 = require("@nestjs/common");
const jwt_1 = require("@nestjs/jwt");
const bcrypt = __importStar(require("bcrypt"));
const client_1 = require("@prisma/client");
const prisma_service_1 = require("../prisma/prisma.service");
const SALT_ROUNDS = 10;
let AuthService = class AuthService {
    prisma;
    jwt;
    constructor(prisma, jwt) {
        this.prisma = prisma;
        this.jwt = jwt;
    }
    async registrarOrganizacion(dto) {
        const existente = await this.prisma.persona.findFirst({ where: { email: dto.email } });
        if (existente) {
            throw new common_1.ConflictException('Ya existe una cuenta con ese email');
        }
        const passwordHash = await bcrypt.hash(dto.password, SALT_ROUNDS);
        const { organizacion, usuario } = await this.prisma.$transaction(async (tx) => {
            const organizacion = await tx.organizacion.create({
                data: { nombre: dto.nombreOrganizacion },
            });
            const persona = await tx.persona.create({
                data: {
                    organizacionId: organizacion.id,
                    nombreCompleto: dto.nombreCompleto,
                    rut: dto.rut,
                    email: dto.email,
                },
            });
            const usuario = await tx.usuario.create({
                data: {
                    organizacionId: organizacion.id,
                    personaId: persona.id,
                    rol: client_1.RolUsuario.ADMINISTRADOR,
                    passwordHash,
                },
            });
            return { organizacion, usuario };
        });
        return this.emitirToken({
            sub: usuario.id,
            organizacionId: organizacion.id,
            personaId: usuario.personaId,
            rol: usuario.rol,
        });
    }
    async login(dto) {
        const persona = await this.prisma.persona.findFirst({
            where: { email: dto.email },
            include: { usuarios: true },
        });
        const usuario = persona?.usuarios[0];
        if (!persona || !usuario) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        const passwordValida = await bcrypt.compare(dto.password, usuario.passwordHash);
        if (!passwordValida || !usuario.activo) {
            throw new common_1.UnauthorizedException('Credenciales inválidas');
        }
        return this.emitirToken({
            sub: usuario.id,
            organizacionId: usuario.organizacionId,
            personaId: usuario.personaId,
            rol: usuario.rol,
        });
    }
    emitirToken(payload) {
        return { accessToken: this.jwt.sign(payload) };
    }
};
exports.AuthService = AuthService;
exports.AuthService = AuthService = __decorate([
    (0, common_1.Injectable)(),
    __metadata("design:paramtypes", [prisma_service_1.PrismaService,
        jwt_1.JwtService])
], AuthService);
//# sourceMappingURL=auth.service.js.map