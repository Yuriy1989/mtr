"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateTableApplicationDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_table_application_dto_1 = require("./create-table-application.dto");
class UpdateTableApplicationDto extends (0, mapped_types_1.PartialType)(create_table_application_dto_1.CreateTableApplicationDto) {
}
exports.UpdateTableApplicationDto = UpdateTableApplicationDto;
//# sourceMappingURL=update-table-application.dto.js.map