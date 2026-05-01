"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateStorageDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_storage_dto_1 = require("./create-storage.dto");
class UpdateStorageDto extends (0, mapped_types_1.PartialType)(create_storage_dto_1.CreateStorageDto) {
}
exports.UpdateStorageDto = UpdateStorageDto;
//# sourceMappingURL=update-storage.dto.js.map