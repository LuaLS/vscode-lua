import * as vscode from 'vscode'
import * as languageserver from './languageserver';
import * as luadoc from '../3rd/vscode-lua-doc/extension';

interface LuaDocExtensionContext extends vscode.ExtensionContext {
    readonly ViewType: string;
    readonly OpenCommand: string;
}

export function activate(context: vscode.ExtensionContext) {
    languageserver.activate(context);

    let luadocContext: LuaDocExtensionContext = {
        subscriptions:                 context.subscriptions,
        workspaceState:                context.workspaceState,
        globalState:                   context.globalState,
        extensionPath:                 context.extensionPath + '/client/3rd/vscode-lua-doc',
        asAbsolutePath:                context.asAbsolutePath,
        storagePath:                   context.storagePath,
        globalStoragePath:             context.globalStoragePath,
        logPath:                       context.logPath,
        extensionUri:                  context.extensionUri,
        environmentVariableCollection: context.environmentVariableCollection,
        extensionMode:                 context.extensionMode,
        ViewType:                      'lua-doc',
        OpenCommand:                   'extension.lua.doc',
    };
    luadoc.activate(luadocContext);
}

export function deactivate() {
    languageserver.deactivate();
}
