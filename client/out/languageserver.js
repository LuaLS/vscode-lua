"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const path = require("path");
const os = require("os");
const fs = require("fs");
const vscode_1 = require("vscode");
let patch = require("./patch");
const vscode_languageclient_1 = require("vscode-languageclient");
let client;
function activate(context) {
    let language = vscode_1.env.language;
    // Options to control the language client
    let clientOptions = {
        // Register the server for plain text documents
        documentSelector: [{ scheme: 'file', language: 'lua' }],
        synchronize: {
            // Notify the server about file changes to '.clientrc files contained in the workspace
            fileEvents: vscode_1.workspace.createFileSystemWatcher('**/.clientrc')
        }
    };
    //let beta: boolean = workspace.getConfiguration("Lua.awakened").get("cat");
    let beta = false;
    let develop = vscode_1.workspace.getConfiguration("Lua.develop").get("enable");
    let debuggerPort = vscode_1.workspace.getConfiguration("Lua.develop").get("debuggerPort");
    let debuggerWait = vscode_1.workspace.getConfiguration("Lua.develop").get("debuggerWait");
    let command;
    let platform = os.platform();
    switch (platform) {
        case "win32":
            command = context.asAbsolutePath(path.join('server', 'bin', 'Windows', 'lua-language-server.exe'));
            break;
        case "linux":
            command = context.asAbsolutePath(path.join('server', 'bin', 'Linux', 'lua-language-server'));
            fs.chmodSync(command, '777');
            break;
        case "darwin":
            command = context.asAbsolutePath(path.join('server', 'bin', 'macOS', 'lua-language-server'));
            fs.chmodSync(command, '777');
            break;
    }
    let serverOptions = {
        command: command,
        args: [
            '-E',
            '-e',
            `LANG="${language}";DEVELOP=${develop};DBGPORT=${debuggerPort};DBGWAIT=${debuggerWait}`,
            context.asAbsolutePath(path.join('server', beta ? 'main-beta.lua' : 'main.lua'))
        ]
    };
    client = new vscode_languageclient_1.LanguageClient('Lua', 'Lua', serverOptions, clientOptions);
    client.registerProposedFeatures();
    patch.patch(client);
    client.start();
}
exports.activate = activate;
function deactivate() {
    if (!client) {
        return undefined;
    }
    return client.stop();
}
exports.deactivate = deactivate;
//# sourceMappingURL=languageserver.js.map