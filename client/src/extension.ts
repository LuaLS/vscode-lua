import * as vscode from 'vscode';
import * as languageserver from './languageserver';
import * as psi from './psi/psiViewer';
import * as addonManager from './addon_manager/registration';

import luadoc from "../3rd/vscode-lua-doc/extension.js";

interface LuaDocContext extends vscode.ExtensionContext {
    ViewType: string;
    OpenCommand: string;
}

export function activate(context: vscode.ExtensionContext) {
    languageserver.activate(context);

    const luaDocContext: LuaDocContext = {
        asAbsolutePath: context.asAbsolutePath,
        environmentVariableCollection: context.environmentVariableCollection,
        extensionUri: context.extensionUri,
        globalState: context.globalState,
        storagePath: context.storagePath,
        subscriptions: context.subscriptions,
        workspaceState: context.workspaceState,
        extensionMode: context.extensionMode,
        globalStorageUri: context.globalStorageUri,
        logUri: context.logUri,
        logPath: context.logPath,
        globalStoragePath: context.globalStoragePath,
        extension: context.extension,
        secrets: context.secrets,
        storageUri: context.storageUri,
        extensionPath: context.extensionPath + '/client/3rd/vscode-lua-doc',
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
