import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as vscode from 'vscode';
import * as types from 'vscode-languageserver-types';
import {
    workspace as Workspace,
    ExtensionContext,
    env as Env,
    commands as Commands,
    TextDocument,
    WorkspaceFolder,
    Uri,
    window,
    TextEditor,
} from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    DocumentSelector,
} from 'vscode-languageclient/node';

let defaultClient: LanguageClient;
let clients: Map<string, LanguageClient> = new Map();

type HintResult = {
    text: string,
    pos:  types.Position,
    kind: types.integer,
}

function registerCustomCommands(context: ExtensionContext) {
    context.subscriptions.push(Commands.registerCommand('lua.config', (changes) => {
        let propMap: Map<string, Map<string, any>> = new Map();
        for (const data of changes) {
            let config = Workspace.getConfiguration(undefined, Uri.parse(data.uri));
            if (data.action == 'add') {
                let value: any[] = config.get(data.key);
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
    }))
}

let _sortedWorkspaceFolders: string[] | undefined;
function sortedWorkspaceFolders(): string[] {
    if (_sortedWorkspaceFolders === void 0) {
        _sortedWorkspaceFolders = Workspace.workspaceFolders ? Workspace.workspaceFolders.map(folder => {
            let result = folder.uri.toString();
            if (result.charAt(result.length - 1) !== '/') {
                result = result + '/';
            }
            return result;
        }).sort(
            (a, b) => {
                return a.length - b.length;
            }
        ) : [];
    }
    return _sortedWorkspaceFolders;
}
Workspace.onDidChangeWorkspaceFolders(() => _sortedWorkspaceFolders = undefined);

function getOuterMostWorkspaceFolder(folder: WorkspaceFolder): WorkspaceFolder {
    let sorted = sortedWorkspaceFolders();
    for (let element of sorted) {
        let uri = folder.uri.toString();
        if (uri.charAt(uri.length - 1) !== '/') {
            uri = uri + '/';
        }
        if (uri.startsWith(element)) {
            return Workspace.getWorkspaceFolder(Uri.parse(element))!;
        }
    }
    return folder;
}

async function chmod(path: fs.PathLike, mode: fs.Mode) {
    await new Promise((resolve) => {
        fs.chmod(path, mode, resolve)
    })
}

async function exists(path: fs.PathLike) {
    return await new Promise((resolve) => {
        fs.stat(path, (err, stats) => {
            if (stats && stats.isDirectory()) {
                resolve(true);
            }
            resolve(false);
        })
    })
}

async function start(context: ExtensionContext, documentSelector: DocumentSelector, folder: WorkspaceFolder) {
    // Options to control the language client
    let clientOptions: LanguageClientOptions = {
        // Register the server for plain text documents
        documentSelector: documentSelector,
        workspaceFolder: folder,
        progressOnInitialization: true,
        markdown: {
            isTrusted: true,
        },
        initializationOptions: {
            changeConfiguration: true,
        }
    };

    let config = Workspace.getConfiguration(undefined, folder);
    let commandParam: string[] = config.get("Lua.misc.parameters");
    let command: string;
    let platform: string = os.platform();
    let binDir: string;
    if (await exists(context.asAbsolutePath(
        path.join(
            'server',
            'bin',
        )
    ))) {
        binDir = 'bin';
    }
    switch (platform) {
        case "win32":
            command = context.asAbsolutePath(
                path.join(
                    'server',
                    binDir ? binDir : 'bin-Windows',
                    'lua-language-server.exe'
                )
            );
            break;
        case "linux":
            command = context.asAbsolutePath(
                path.join(
                    'server',
                    binDir ? binDir : 'bin-Linux',
                    'lua-language-server'
                )
            );
            await chmod(command, '777');
            break;
        case "darwin":
            command = context.asAbsolutePath(
                path.join(
                    'server',
                    binDir ? binDir : 'bin-macOS',
                    'lua-language-server'
                )
            );
            await chmod(command, '777');
            break;
    }

    let serverOptions: ServerOptions = {
        command: command,
        args:    commandParam,
    };

    let client = new LanguageClient(
        'Lua',
        'Lua',
        serverOptions,
        clientOptions
    );

    //client.registerProposedFeatures();
    client.start();
    client.onReady().then(() => {
        onCommand(client);
        onDecorations(client)
        //onInlayHint(client);
        statusBar(client);
    });

    return client;
}

let barCount = 0;
function statusBar(client: LanguageClient) {
    let bar = window.createStatusBarItem();
    bar.text = 'Lua';
    barCount ++;
    bar.command = 'Lua.statusBar:' + barCount;
    Commands.registerCommand(bar.command, () => {
        client.sendNotification('$/status/click');
    })
    client.onNotification('$/status/show', (params) => {
        bar.show();
    })
    client.onNotification('$/status/hide', (params) => {
        bar.hide();
    })
    client.onNotification('$/status/report', (params) => {
        bar.text    = params.text;
        bar.tooltip = params.tooltip;
    })
    client.sendNotification('$/status/refresh');
}

function onCommand(client: LanguageClient) {
    client.onNotification('$/command', (params) => {
        Commands.executeCommand(params.command, params.data);
    });
}

function isDocumentInClient(textDocuments: TextDocument, client: LanguageClient): boolean {
    let selectors = client.clientOptions.documentSelector;
    if (!DocumentSelector.is(selectors)) {{
        return false;
    }}
    if (vscode.languages.match(selectors, textDocuments)) {
        return true;
    }
    return false;
}

function onDecorations(client: LanguageClient) {
    let textType = window.createTextEditorDecorationType({})

    function notifyVisibleRanges(textEditor: TextEditor) {
        if (!isDocumentInClient(textEditor.document, client)) {
            return;
        }
        let uri:    types.DocumentUri = client.code2ProtocolConverter.asUri(textEditor.document.uri);
        let ranges: types.Range[] = [];
        for (let index = 0; index < textEditor.visibleRanges.length; index++) {
            const range = textEditor.visibleRanges[index];
            ranges[index] = client.code2ProtocolConverter.asRange(new vscode.Range(
                Math.max(range.start.line - 3, 0),
                range.start.character,
                Math.min(range.end.line + 3, textEditor.document.lineCount - 1),
                range.end.character
            ));
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
            uri:    uri,
            ranges: ranges,
        })
    }

    for (let index = 0; index < window.visibleTextEditors.length; index++) {
        notifyVisibleRanges(window.visibleTextEditors[index]);
    }

    window.onDidChangeVisibleTextEditors((params: TextEditor[]) => {
        for (let index = 0; index < params.length; index++) {
            notifyVisibleRanges(params[index]);
        }
    })

    window.onDidChangeTextEditorVisibleRanges((params: vscode.TextEditorVisibleRangesChangeEvent) => {
        notifyVisibleRanges(params.textEditor);
    })

    client.onNotification('$/hint', (params) => {
        let uri:        types.URI = params.uri;
        for (let index = 0; index < window.visibleTextEditors.length; index++) {
            const editor = window.visibleTextEditors[index];
            if (editor.document.uri.toString() == uri && isDocumentInClient(editor.document, client)) {
                let textEditor = editor;
                let edits: HintResult[] = params.edits
                let options: vscode.DecorationOptions[] = [];
                for (let index = 0; index < edits.length; index++) {
                    const edit = edits[index];
                    let pos = client.protocol2CodeConverter.asPosition(edit.pos);
                    options[index] = {
                        hoverMessage:  edit.text,
                        range:         new vscode.Range(pos, pos),
                        renderOptions: {
                            light: {
                                after: {
                                    contentText:     edit.text,
                                    color:           '#888888',
                                    backgroundColor: '#EEEEEE;border-radius: 5px;',
                                    fontWeight:      '400; font-size: 12px; line-height: 1;',
                                }
                            },
                            dark: {
                                after: {
                                    contentText:     edit.text,
                                    color:           '#888888',
                                    backgroundColor: '#333333;border-radius: 5px;',
                                    fontWeight:      '400; font-size: 12px; line-height: 1;',
                                }
                            }
                        }
                    }
                }
                textEditor.setDecorations(textType, options);
            }
        }
    })
}

function onInlayHint(client: LanguageClient) {
    vscode.languages.registerInlayHintsProvider(client.clientOptions.documentSelector, {
        provideInlayHints: async (model: TextDocument, range: vscode.Range): Promise<vscode.InlayHint[]> => {
            let pdoc    = client.code2ProtocolConverter.asTextDocumentIdentifier(model);
            let prange  = client.code2ProtocolConverter.asRange(range);
            let results: HintResult[] = await client.sendRequest('$/requestHint', {
                textDocument: pdoc,
                range:        prange,
            });
            if (!results) {
                return [];
            }
            let hints: vscode.InlayHint[] = [];
            for (const result of results) {
                let hint = new vscode.InlayHint(
                    result.text,
                    client.protocol2CodeConverter.asPosition(result.pos),
                    result.kind
                );
                hints.push(hint);
            }
            return hints;
        }
    })
}

export function activate(context: ExtensionContext) {
    registerCustomCommands(context);
    async function didOpenTextDocument(document: TextDocument) {
        // We are only interested in language mode text
        if (document.languageId !== 'lua' || (document.uri.scheme !== 'file' && document.uri.scheme !== 'untitled')) {
            return;
        }

        let uri = document.uri;
        let folder = Workspace.getWorkspaceFolder(uri);
        // Untitled files go to a default client.
        if (folder == null && Workspace.workspaceFolders == null && !defaultClient) {
            defaultClient = await start(context, [
                { scheme: 'file', language: 'lua' }
            ], null);
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
            let pattern: string = folder.uri.fsPath.replace(/(\[|\])/g, '[$1]') + '/**/*';
            let client = await start(context, [
                { scheme: 'file', language: 'lua', pattern: pattern }
            ], folder);
            clients.set(folder.uri.toString(), client);
        }
    }

    function didCloseTextDocument(document: TextDocument): void {
        let uri = document.uri;
        if (clients.has(uri.toString())) {
            let client = clients.get(uri.toString());
            if (client) {
                clients.delete(uri.toString());
                client.stop();
            }
        }
    }

    Workspace.onDidOpenTextDocument(didOpenTextDocument);
    //Workspace.onDidCloseTextDocument(didCloseTextDocument);
    Workspace.textDocuments.forEach(didOpenTextDocument);
    Workspace.onDidChangeWorkspaceFolders((event) => {
        for (let folder of event.removed) {
            let client = clients.get(folder.uri.toString());
            if (client) {
                clients.delete(folder.uri.toString());
                client.stop();
            }
        }
    });
}

export function deactivate(): Thenable<void> | undefined {
    let promises: Thenable<void>[] = [];
    if (defaultClient) {
        promises.push(defaultClient.stop());
    }
    for (let client of clients.values()) {
        promises.push(client.stop());
    }
    return Promise.all(promises).then(() => undefined);
}
