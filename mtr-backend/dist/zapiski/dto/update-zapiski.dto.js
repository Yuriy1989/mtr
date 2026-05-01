"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateZapiskiDto = void 0;
const swagger_1 = require("@nestjs/swagger");
const create_zapiski_dto_1 = require("./create-zapiski.dto");
class UpdateZapiskiDto extends (0, swagger_1.PartialType)(create_zapiski_dto_1.CreateZapiskiDto) {
}
exports.UpdateZapiskiDto = UpdateZapiskiDto;
//# sourceMappingURL=update-zapiski.dto.js.map