import * as path from 'path';
import * as os from 'os';
import * as fs from 'fs';
import * as vscode from 'vscode';
import {
    workspace as Workspace,
    ExtensionContext,
    commands as Commands,
    TextDocument,
    Uri,
    window,
    Disposable,
} from 'vscode';
import {
    LanguageClient,
    LanguageClientOptions,
    ServerOptions,
    DocumentSelector,
    LSPAny,
    ExecuteCommandRequest,
    TransportKind,
} from 'vscode-languageclient/node';

export let defaultClient: LuaClient | null;

function registerCustomCommands(context: ExtensionContext) {
    context.subscriptions.push(Commands.registerCommand('lua.config', (changes) => {
        const propMap: Record<string, Record<string, unknown>> = {};

        for (const data of changes) {
            const config = Workspace.getConfiguration(undefined, Uri.parse(data.uri));

            if (data.action === 'add') {
                const value = config.get(data.key);
                if (!Array.isArray(value)) throw new Error(`${data.key} is not an Array!`);
                value.push(data.value);
                config.update(data.key, value, data.global);
                continue;
            }
            if (data.action === 'set') {
                config.update(data.key, data.value, data.global);
                continue;
            }
            if (data.action === 'prop') {
                if (!propMap[data.key]) {
                    let prop = config.get(data.key);
                    if (typeof prop === 'object' && prop !== null) {
                        propMap[data.key] = prop as Record<string, unknown>;
                    }
                }
                propMap[data.key][data.prop] = data.value;
                config.update(data.key, propMap[data.key], data.global);
                continue;
            }
        }
    }));

    context.subscriptions.push(Commands.registerCommand('lua.exportDocument', async () => {
        if (!defaultClient) {
            return;
        }
        const outputs = await vscode.window.showOpenDialog({
            defaultUri: vscode.Uri.joinPath(
                context.extensionUri,
                'server',
                'log',
            ),
            openLabel: "Export to this folder",
            canSelectFiles: false,
            canSelectFolders: true,
            canSelectMany: false,
        });
        const output = outputs?.[0];
        if (!output) {
            return;
        }
        defaultClient.client?.sendRequest(ExecuteCommandRequest.type, {
            command: 'lua.exportDocument',
            arguments: [output.toString()],
        });
    }));

    context.subscriptions.push(Commands.registerCommand('lua.reloadFFIMeta', async () => {
        defaultClient?.client?.sendRequest(ExecuteCommandRequest.type, {
            command: 'lua.reloadFFIMeta',
        })
    }))

    context.subscriptions.push(Commands.registerCommand('lua.startServer', async () => {
        deactivate();
        createClient(context);
    }));

    context.subscriptions.push(Commands.registerCommand('lua.stopServer', async () => {
        deactivate();
    }));

    context.subscriptions.push(Commands.registerCommand('lua.showReferences', (uri: string, position: Record<string, number>, locations: any[]) => {
        vscode.commands.executeCommand(
            'editor.action.showReferences',
            vscode.Uri.parse(uri),
            new vscode.Position(position.line, position.character),
            locations.map((value) => {
                return new vscode.Location(
                    vscode.Uri.parse(value.uri as any as string),
                    new vscode.Range(
                        value.range.start.line,
                        value.range.start.character,
                        value.range.end.line,
                        value.range.end.character,
                    ),
                );
            })
        );
    }));
}

/** Creates a new {@link LuaClient} and starts it. */
export const createClient = (context: ExtensionContext) => {
    defaultClient = new LuaClient(context, [{ language: 'lua' }])
    defaultClient.start();
}

class LuaClient extends Disposable {
    public client: LanguageClient | undefined;
    private disposables = new Array<Disposable>();
    constructor(
        private context: ExtensionContext,
        private documentSelector: DocumentSelector
    ) {
        super(() => {
            for (const disposable of this.disposables) {
                disposable.dispose();
            }
        });
    }

    async start() {
        // Options to control the language client
        const clientOptions: LanguageClientOptions = {
            // Register the server for plain text documents
            documentSelector: this.documentSelector,
            progressOnInitialization: true,
            markdown: {
                isTrusted: true,
                supportHtml: true,
            },
            initializationOptions: {
                changeConfiguration: true,
                statusBar: true,
                viewDocument: true,
                trustByClient: true,
                useSemanticByRange: true,
                codeLensViewReferences: true,
                fixIndents: true,
                languageConfiguration: true,
                storagePath: this.context.globalStorageUri.fsPath,
            },
        };

        const config = Workspace.getConfiguration(
            undefined,
            vscode.workspace.workspaceFolders?.[0]
        );
        const commandParam = config.get("Lua.misc.parameters");
        const command = await this.getCommand(config);

        if (!Array.isArray(commandParam))
            throw new Error("Lua.misc.parameters must be an Array!");

        const port = this.getPort(commandParam);

        const serverOptions: ServerOptions = {
            command: command,
            transport: port
                ? {
                      kind: TransportKind.socket,
                      port: port,
                  }
                : undefined,
            args: commandParam,
        };

        this.client = new LanguageClient(
            "Lua",
            "Lua",
            serverOptions,
            clientOptions
        );
        this.disposables.push(this.client);

        //client.registerProposedFeatures();
        await this.client.start();
        this.onCommand();
        this.statusBar();
        this.languageConfiguration();
    }

    private async getCommand(config: vscode.WorkspaceConfiguration) {
        const executablePath = config.get("Lua.misc.executablePath");

        if (typeof executablePath !== "string")
            throw new Error("Lua.misc.executablePath must be a string!");

        if (executablePath && executablePath !== "") {
            return executablePath;
        }

        const platform: string = os.platform();
        let command: string;
        let binDir: string | undefined;

        if (
            (
                await fs.promises.stat(
                    this.context.asAbsolutePath("server/bin")
                )
            ).isDirectory()
        ) {
            binDir = "bin";
        }

        switch (platform) {
            case "win32":
                command = this.context.asAbsolutePath(
                    path.join(
                        "server",
                        binDir ? binDir : "bin-Windows",
                        "lua-language-server.exe"
                    )
                );
                break;
            case "linux":
                command = this.context.asAbsolutePath(
                    path.join(
                        "server",
                        binDir ? binDir : "bin-Linux",
                        "lua-language-server"
                    )
                );
                await fs.promises.chmod(command, "777");
                break;
            case "darwin":
                command = this.context.asAbsolutePath(
                    path.join(
                        "server",
                        binDir ? binDir : "bin-macOS",
                        "lua-language-server"
                    )
                );
                await fs.promises.chmod(command, "777");
                break;
            default:
                throw new Error(`Unsupported operating system "${platform}"!`);
        }
        return command;
    }

    // Generated by Copilot
    private getPort(commandParam: string[]): number | undefined {
        // "--socket=xxxx" or "--socket xxxx"
        const portIndex = commandParam.findIndex((value) => {
            return value.startsWith("--socket");
        });
        if (portIndex === -1) {
            return undefined;
        }
        const port =
            commandParam[portIndex].split("=")[1] ||
            commandParam[portIndex].split(" ")[1] ||
            commandParam[portIndex + 1];
        if (!port) {
            return undefined;
        }
        return Number(port);
    }

    async stop() {
        this.client?.stop();
        this.dispose();
    }

    private statusBar() {
        const client = this.client!;
        const bar = window.createStatusBarItem(vscode.StatusBarAlignment.Right);
        bar.text = "Lua";
        bar.command = "Lua.statusBar";
        this.disposables.push(
            Commands.registerCommand(bar.command, () => {
                client.sendNotification("$/status/click");
            })
        );
        this.disposables.push(
            client.onNotification("$/status/show", () => {
                bar.show();
            })
        );
        this.disposables.push(
            client.onNotification("$/status/hide", () => {
                bar.hide();
            })
        );
        this.disposables.push(
            client.onNotification("$/status/report", (params) => {
                bar.text = params.text;
                bar.tooltip = params.tooltip;
            })
        );
        client.sendNotification("$/status/refresh");
        this.disposables.push(bar);
    }

    private onCommand() {
        if (!this.client) {
            return;
        }
        this.disposables.push(
            this.client.onNotification("$/command", (params) => {
                Commands.executeCommand(params.command, params.data);
            })
        );
    }

    private languageConfiguration() {
        if (!this.client) {
            return;
        }

        function convertStringsToRegex(config: any): any {
            if (typeof config !== 'object' || config === null) {
                return config;
            }

            for (const key in config) {
                if (config.hasOwnProperty(key)) {
                    const value = config[key];

                    if (typeof value === 'object' && value !== null) {
                        convertStringsToRegex(value);
                    }

                    if (key === 'beforeText' || key === 'afterText') {
                        if (typeof value === 'string') {
                            config[key] = new RegExp(value);
                        }
                    }
                }
            }

            return config;
        }

        let configuration: Disposable | undefined;
        this.disposables.push(
            this.client.onNotification('$/languageConfiguration', (params) => {
                configuration?.dispose();
                configuration = vscode.languages.setLanguageConfiguration(params.id, convertStringsToRegex(params.configuration));
                this.disposables.push(configuration);
            })
        )
    }
}

export function activate(context: ExtensionContext) {
    registerCustomCommands(context);
    function didOpenTextDocument(document: TextDocument) {
        // We are only interested in language mode text
        if (document.languageId !== 'lua') {
            return;
        }

        // Untitled files go to a default client.
        if (!defaultClient) {
            createClient(context);
            return;
        }
    }

    Workspace.onDidOpenTextDocument(didOpenTextDocument);
    Workspace.textDocuments.forEach(didOpenTextDocument);
}

export async function deactivate() {
    if (defaultClient) {
        defaultClient.stop();
        defaultClient.dispose();
        defaultClient = null;
    }
    return undefined;
}
vscode.SyntaxTokenType.String
export async function reportAPIDoc(params: unknown) {
    if (!defaultClient) {
        return;
    }
    defaultClient.client?.sendNotification('$/api/report', params);
}

export type ConfigChange = {
    action:  "set",
    key:     string,
    value:   LSPAny,
    uri:     vscode.Uri,
    global?: boolean,
} | {
    action:  "add",
    key:     string,
    value:   LSPAny,
    uri:     vscode.Uri,
    global?: boolean,
} | {
    action:  "prop",
    key:     string,
    prop:    string;
    value:   LSPAny,
    uri:     vscode.Uri,
    global?: boolean,
}

export async function setConfig(changes: ConfigChange[]): Promise<boolean> {
    if (!defaultClient) {
        return false;
    }
    const params = [];
    for (const change of changes) {
        params.push({
            action: change.action,
            prop:   (change.action === "prop") ? change.prop : undefined as never,
            key:    change.key,
            value:  change.value,
            uri:    change.uri.toString(),
            global: change.global,
        });
    }
    await defaultClient.client?.sendRequest(ExecuteCommandRequest.type, {
        command: 'lua.setConfig',
        arguments: params,
    });
    return true;
}

export async function getConfig(key: string, uri: vscode.Uri): Promise<LSPAny> {
    if (!defaultClient) {
        return undefined;
    }
    return await defaultClient.client?.sendRequest(ExecuteCommandRequest.type, {
        command: 'lua.getConfig',
        arguments: [{
            uri: uri.toString(),
            key: key,
        }]
    });
}
