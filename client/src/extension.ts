import * as vscode from 'vscode';
import * as languageserver from './languageserver';
import * as psi from './psi/psiViewer';
import * as addonManager from './addon_manager/registration';

import luadoc from "../3rd/vscode-lua-doc/extension.js";

export function activate(context: vscode.ExtensionContext) {
    languageserver.activate(context);

    const luaDocContext = {
        extensionPath: context.extensionPath + '/client/3rd/vscode-lua-doc',
        subscriptions: context.subscriptions,
        ViewType: 'lua-doc',
        OpenCommand: 'extension.lua.doc',
    }

    luadoc.activate(luaDocContext);
    psi.activate(context);

    // Register and activate addon manager
    addonManager.activate(context);

    return {
        async reportAPIDoc(params: unknown) {
            await languageserver.reportAPIDoc(params);
        },
        async setConfig(changes: languageserver.ConfigChange[]) {
            await languageserver.setConfig(changes);
        }
    };
}

export function deactivate() {
    languageserver.deactivate();
}
