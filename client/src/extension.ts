import * as vscode from 'vscode';
import * as languageserver from './languageserver';
import * as psi from './psi/psiViewer';
import * as addonManager from './addon_manager/registration';

import luadoc from "../3rd/vscode-lua-doc/extension.js";

export function activate(context: vscode.ExtensionContext) {
    languageserver.activate(context);

    const luaDocContext = {
        ViewType:      undefined,
        OpenCommand:   undefined,
        extensionPath: undefined,
    };

    for (const k in context) {
        try {
            luaDocContext[k] = context[k];
        } catch (error) {
            console.error(error);
        }
    }
    luaDocContext.ViewType      = 'lua-doc';
    luaDocContext.OpenCommand   = 'extension.lua.doc';
    luaDocContext.extensionPath = context.extensionPath + '/client/3rd/vscode-lua-doc';

    luadoc.activate(luaDocContext);
    psi.activate(context);

    // Register and activate addon manager
    addonManager.activate(context);

    return {
        async reportAPIDoc(params: unknown) {
            await languageserver.reportAPIDoc(params);
        }
    };
}

export function deactivate() {
    languageserver.deactivate();
}


