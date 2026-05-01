"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkHash = exports.createHash = void 0;
const bcrypt = require("bcrypt");
const constants_1 = require("../constants");
const createHash = (data) => {
    return bcrypt.hash(data, constants_1.SALT);
};
exports.createHash = createHash;
const checkHash = (data, hash) => {
    return bcrypt.compare(data, hash);
};
exports.checkHash = checkHash;
//# sourceMappingURL=hash.js.map