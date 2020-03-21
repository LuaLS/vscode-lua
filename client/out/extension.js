"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const languageserver = require("./languageserver");
const luadoc = require("./luadoc");
function activate(context) {
    languageserver.activate(context);
    luadoc.activate(context);
}
exports.activate = activate;
function deactivate() {
    languageserver.deactivate();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map