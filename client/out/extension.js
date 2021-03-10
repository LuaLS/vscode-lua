"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const languageserver = require("./languageserver");
let luadoc = require('../3rd/vscode-lua-doc/extension.js');
function activate(context) {
    languageserver.activate(context);
    let luaDocContext = {
        ViewType: undefined,
        OpenCommand: undefined,
        extensionPath: undefined,
    };
    for (const k in context) {
        try {
            luaDocContext[k] = context[k];
        }
        catch (error) { }
    }
    luaDocContext.ViewType = 'lua-doc';
    luaDocContext.OpenCommand = 'extension.lua.doc';
    luaDocContext.extensionPath = context.extensionPath + '/client/3rd/vscode-lua-doc';
    luadoc.activate(luaDocContext);
}
exports.activate = activate;
function deactivate() {
    languageserver.deactivate();
}
exports.deactivate = deactivate;
//# sourceMappingURL=extension.js.map