"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UpdateJournalDto = void 0;
const mapped_types_1 = require("@nestjs/mapped-types");
const create_journal_dto_1 = require("./create-journal.dto");
class UpdateJournalDto extends (0, mapped_types_1.PartialType)(create_journal_dto_1.CreateJournalDto) {
}
exports.UpdateJournalDto = UpdateJournalDto;
//# sourceMappingURL=update-journal.dto.js.map