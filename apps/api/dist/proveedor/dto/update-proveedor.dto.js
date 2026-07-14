"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateProveedorDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_proveedor_dto_1 = require("./create-proveedor.dto");
class UpdateProveedorDto extends (0, mapped_types_1.PartialType)(create_proveedor_dto_1.CreateProveedorDto) {
}
exports.UpdateProveedorDto = UpdateProveedorDto;
//# sourceMappingURL=update-proveedor.dto.js.map