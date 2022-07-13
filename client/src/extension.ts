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
        try {
            luaDocContext[k] = context[k];
        } catch (error) {}
    }
    luaDocContext.ViewType      = 'lua-doc';
    luaDocContext.OpenCommand   = 'extension.lua.doc';
    luaDocContext.extensionPath = context.extensionPath + '/client/3rd/vscode-lua-doc'

    luadoc.activate(luaDocContext);
}

export function deactivate() {
    languageserver.deactivate();
}

export async function reportAPIDoc(params: any) {
    await languageserver.reportAPIDoc(params);
}
