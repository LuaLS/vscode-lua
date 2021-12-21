"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deactivate = exports.activate = void 0;
const path = require("path");
const os = require("os");
const fs = require("fs");
const vscode = require("vscode");
const vscode_1 = require("vscode");
const node_1 = require("vscode-languageclient/node");
let defaultClient;
let clients = new Map();
function registerCustomCommands(context) {
    context.subscriptions.push(vscode_1.commands.registerCommand('lua.config', (changes) => {
        let propMap = new Map();
        for (const data of changes) {
            let config = vscode_1.workspace.getConfiguration(undefined, vscode_1.Uri.parse(data.uri));
            if (data.action == 'add') {
                let value = config.get(data.key);
                value.push(data.value);
                config.update(data.key, value, data.global);
                continue;
            }
            if (data.action == 'set') {
                config.update(data.key, data.value, data.global);
                continue;
            }
            if (data.action == 'prop') {
                if (!propMap[data.key]) {
                    propMap[data.key] = config.get(data.key);
                }
                propMap[data.key][data.prop] = data.value;
                config.update(data.key, propMap[data.key], data.global);
                continue;
            }
        }
    }));
}
let _sortedWorkspaceFolders;
function sortedWorkspaceFolders() {
    if (_sortedWorkspaceFolders === void 0) {
        _sortedWorkspaceFolders = vscode_1.workspace.workspaceFolders ? vscode_1.workspace.workspaceFolders.map(folder => {
            let result = folder.uri.toString();
            if (result.charAt(result.length - 1) !== '/') {
                result = result + '/';
            }
            return result;
        }).sort((a, b) => {
            return a.length - b.length;
        }) : [];
    }
    return _sortedWorkspaceFolders;
}
vscode_1.workspace.onDidChangeWorkspaceFolders(() => _sortedWorkspaceFolders = undefined);
function getOuterMostWorkspaceFolder(folder) {
    let sorted = sortedWorkspaceFolders();
    for (let element of sorted) {
        let uri = folder.uri.toString();
        if (uri.charAt(uri.length - 1) !== '/') {
            uri = uri + '/';
        }
        if (uri.startsWith(element)) {
            return vscode_1.workspace.getWorkspaceFolder(vscode_1.Uri.parse(element));
        }
    }
    return folder;
}
class LuaClient {
    constructor(context, documentSelector, folder) {
        this.context = context;
        this.documentSelector = documentSelector;
        this.folder = folder;
    }
    start() {
        return __awaiter(this, void 0, void 0, function* () {
            // Options to control the language client
            let clientOptions = {
                // Register the server for plain text documents
                documentSelector: this.documentSelector,
                workspaceFolder: this.folder,
                progressOnInitialization: true,
                markdown: {
                    isTrusted: true,
                },
                initializationOptions: {
                    changeConfiguration: true,
                }
            };
            let config = vscode_1.workspace.getConfiguration(undefined, this.folder);
            let commandParam = config.get("Lua.misc.parameters");
            let command;
            let platform = os.platform();
            let binDir;
            if ((yield fs.promises.stat(this.context.asAbsolutePath('server/bin'))).isDirectory()) {
                binDir = 'bin';
            }
            switch (platform) {
                case "win32":
                    command = this.context.asAbsolutePath(path.join('server', binDir ? binDir : 'bin-Windows', 'lua-language-server.exe'));
                    break;
                case "linux":
                    command = this.context.asAbsolutePath(path.join('server', binDir ? binDir : 'bin-Linux', 'lua-language-server'));
                    yield fs.promises.chmod(command, '777');
                    break;
                case "darwin":
                    command = this.context.asAbsolutePath(path.join('server', binDir ? binDir : 'bin-macOS', 'lua-language-server'));
                    yield fs.promises.chmod(command, '777');
                    break;
            }
            let serverOptions = {
                command: command,
                args: commandParam,
            };
            this.client = new node_1.LanguageClient('Lua', 'Lua', serverOptions, clientOptions);
            //client.registerProposedFeatures();
            this.client.start();
            yield this.client.onReady();
            onCommand(this.client);
            onDecorations(this.client);
            //onInlayHint(client);
            statusBar(this.client);
        });
    }
    stop() {
        return __awaiter(this, void 0, void 0, function* () {
            this.client.stop();
        });
    }
}
let barCount = 0;
function statusBar(client) {
    let bar = vscode_1.window.createStatusBarItem();
    bar.text = 'Lua';
    barCount++;
    bar.command = 'Lua.statusBar:' + barCount;
    vscode_1.commands.registerCommand(bar.command, () => {
        client.sendNotification('$/status/click');
    });
    client.onNotification('$/status/show', (params) => {
        bar.show();
    });
    client.onNotification('$/status/hide', (params) => {
        bar.hide();
    });
    client.onNotification('$/status/report', (params) => {
        bar.text = params.text;
        bar.tooltip = params.tooltip;
    });
    client.sendNotification('$/status/refresh');
}
function onCommand(client) {
    client.onNotification('$/command', (params) => {
        vscode_1.commands.executeCommand(params.command, params.data);
    });
}
function isDocumentInClient(textDocuments, client) {
    let selectors = client.clientOptions.documentSelector;
    if (!node_1.DocumentSelector.is(selectors)) {
        {
            return false;
        }
    }
    if (vscode.languages.match(selectors, textDocuments)) {
        return true;
    }
    return false;
}
function onDecorations(client) {
    let textType = vscode_1.window.createTextEditorDecorationType({});
    function notifyVisibleRanges(textEditor) {
        if (!isDocumentInClient(textEditor.document, client)) {
            return;
        }
        let uri = client.code2ProtocolConverter.asUri(textEditor.document.uri);
        let ranges = [];
        for (let index = 0; index < textEditor.visibleRanges.length; index++) {
            const range = textEditor.visibleRanges[index];
            ranges[index] = client.code2ProtocolConverter.asRange(new vscode.Range(Math.max(range.start.line - 3, 0), range.start.character, Math.min(range.end.line + 3, textEditor.document.lineCount - 1), range.end.character));
        }
        for (let index = ranges.length; index > 1; index--) {
            const current = ranges[index];
            const before = ranges[index - 1];
            if (current.start.line > before.end.line) {
                continue;
            }
            if (current.start.line == before.end.line && current.start.character > before.end.character) {
                continue;
            }
            ranges.pop();
            before.end = current.end;
        }
        client.sendNotification('$/didChangeVisibleRanges', {
            uri: uri,
            ranges: ranges,
        });
    }
    for (let index = 0; index < vscode_1.window.visibleTextEditors.length; index++) {
        notifyVisibleRanges(vscode_1.window.visibleTextEditors[index]);
    }
    vscode_1.window.onDidChangeVisibleTextEditors((params) => {
        for (let index = 0; index < params.length; index++) {
            notifyVisibleRanges(params[index]);
        }
    });
    vscode_1.window.onDidChangeTextEditorVisibleRanges((params) => {
        notifyVisibleRanges(params.textEditor);
    });
    client.onNotification('$/hint', (params) => {
        let uri = params.uri;
        for (let index = 0; index < vscode_1.window.visibleTextEditors.length; index++) {
            const editor = vscode_1.window.visibleTextEditors[index];
            if (editor.document.uri.toString() == uri && isDocumentInClient(editor.document, client)) {
                let textEditor = editor;
                let edits = params.edits;
                let options = [];
                for (let index = 0; index < edits.length; index++) {
                    const edit = edits[index];
                    let pos = client.protocol2CodeConverter.asPosition(edit.pos);
                    options[index] = {
                        hoverMessage: edit.text,
                        range: new vscode.Range(pos, pos),
                        renderOptions: {
                            light: {
                                after: {
                                    contentText: edit.text,
                                    color: '#888888',
                                    backgroundColor: '#EEEEEE;border-radius: 5px;',
                                    fontWeight: '400; font-size: 12px; line-height: 1;',
                                }
                            },
                            dark: {
                                after: {
                                    contentText: edit.text,
                                    color: '#888888',
                                    backgroundColor: '#333333;border-radius: 5px;',
                                    fontWeight: '400; font-size: 12px; line-height: 1;',
                                }
                            }
                        }
                    };
                }
                textEditor.setDecorations(textType, options);
            }
        }
    });
}
function onInlayHint(client) {
    vscode.languages.registerInlayHintsProvider(client.clientOptions.documentSelector, {
        provideInlayHints: (model, range) => __awaiter(this, void 0, void 0, function* () {
            let pdoc = client.code2ProtocolConverter.asTextDocumentIdentifier(model);
            let prange = client.code2ProtocolConverter.asRange(range);
            let results = yield client.sendRequest('$/requestHint', {
                textDocument: pdoc,
                range: prange,
            });
            if (!results) {
                return [];
            }
            let hints = [];
            for (const result of results) {
                let hint = new vscode.InlayHint(result.text, client.protocol2CodeConverter.asPosition(result.pos), result.kind);
                hints.push(hint);
            }
            return hints;
        })
    });
}
function activate(context) {
    registerCustomCommands(context);
    function didOpenTextDocument(document) {
        // We are only interested in language mode text
        if (document.languageId !== 'lua' || (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled')) {
            return;
        }
        let uri = document.uri;
        let folder = vscode_1.workspace.getWorkspaceFolder(uri);
        // Untitled files go to a default client.
        if (folder == null && vscode_1.workspace.workspaceFolders == null && !defaultClient) {
            defaultClient = new LuaClient(context, [
                { scheme: 'file', language: 'lua' }
            ], null);
            defaultClient.start();
            return;
        }
        // Files outside a folder can't be handled. This might depend on the language.
        // Single file languages like JSON might handle files outside the workspace folders.
        if (!folder) {
            return;
        }
        // If we have nested workspace folders we only start a server on the outer most workspace folder.
        folder = getOuterMostWorkspaceFolder(folder);
        if (!clients.has(folder.uri.toString())) {
            let pattern = folder.uri.fsPath.replace(/(\[|\])/g, '[$1]') + '/**/*';
            let client = new LuaClient(context, [
                { scheme: 'file', language: 'lua', pattern: pattern }
            ], folder);
            clients.set(folder.uri.toString(), client);
            client.start();
        }
    }
    function didCloseTextDocument(document) {
        let uri = document.uri;
        if (clients.has(uri.toString())) {
            let client = clients.get(uri.toString());
            if (client) {
                clients.delete(uri.toString());
                client.stop();
            }
        }
    }
    vscode_1.workspace.onDidOpenTextDocument(didOpenTextDocument);
    //Workspace.onDidCloseTextDocument(didCloseTextDocument);
    vscode_1.workspace.textDocuments.forEach(didOpenTextDocument);
    vscode_1.workspace.onDidChangeWorkspaceFolders((event) => {
        for (let folder of event.removed) {
            let client = clients.get(folder.uri.toString());
            if (client) {
                clients.delete(folder.uri.toString());
                client.stop();
            }
        }
    });
}
exports.activate = activate;
function deactivate() {
    return __awaiter(this, void 0, void 0, function* () {
        let promises = [];
        if (defaultClient) {
            promises.push(defaultClient.stop());
        }
        for (let client of clients.values()) {
            promises.push(client.stop());
        }
        yield Promise.all(promises);
        return undefined;
    });
}
exports.deactivate = deactivate;
//# sourceMappingURL=languageserver.js.map