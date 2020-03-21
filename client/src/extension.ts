import * as vscode from 'vscode'
import * as languageserver from './languageserver';
import * as luadoc from '../3rd/vscode-lua-doc/extension';

export function activate(context: vscode.ExtensionContext) {
    languageserver.activate(context);

    let luadocContext: vscode.ExtensionContext = {
        subscriptions:      context.subscriptions,
        workspaceState:     context.workspaceState,
        globalState:        context.globalState,
        extensionPath:      context.extensionPath + '/client/3rd/vscode-lua-doc',
        asAbsolutePath:     context.asAbsolutePath,
        storagePath:        context.storagePath,
        globalStoragePath:  context.globalStoragePath,
        logPath:            context.logPath,
    };
    luadoc.activate(luadocContext);
}

export function deactivate() {
    languageserver.deactivate();
}
