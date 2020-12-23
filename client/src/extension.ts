import * as vscode from 'vscode'
import * as languageserver from './languageserver';

let luadoc = require('../3rd/vscode-lua-doc/extension.js')

export function activate(context: vscode.ExtensionContext) {
    
    languageserver.activate(context);

    let luaDocContext = {
        ViewType:      undefined,
        OpenCommand:   undefined,
        extensionPath: undefined,
    }

    for (const k in context) {
        if (k != 'extensionPath'
        &&  k != 'extensionRuntime') {
            luaDocContext[k] = context[k];
        }
    }
    luaDocContext.ViewType      = 'lua-doc';
    luaDocContext.OpenCommand   = 'extension.lua.doc';
    luaDocContext.extensionPath = context.extensionPath + '/client/3rd/vscode-lua-doc'

    luadoc.activate(luaDocContext);
}

export function deactivate() {
    languageserver.deactivate();
}
