import * as vscode from "vscode";

import { createChildLogger } from "../services/logging.service";
import { commands } from "../commands";
import { Notification, WebVueMessage } from "../types/webvue";
import { DEVELOPMENT_IFRAME_URL } from "../config";

const localLogger = createChildLogger("WebVue");
const commandLogger = createChildLogger("Command");

export class WebVue {
    public static currentPanel: WebVue | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];

    private constructor(
        context: vscode.ExtensionContext,
        panel: vscode.WebviewPanel
    ) {
        const extensionUri = context.extensionUri;

        this._panel = panel;
        this._extensionUri = extensionUri;
        this._panel.iconPath = {
            dark: vscode.Uri.joinPath(extensionUri, "images", "logo.png"),
            light: vscode.Uri.joinPath(extensionUri, "images", "logo.png"),
        };
        this._disposables.push(
            this._panel.onDidDispose(this.dispose, null, this._disposables),
            this._setWebviewMessageListener(this._panel.webview, context)
        );
        this._panel.webview.html = this._getWebViewContent(
            this._panel.webview,
            context
        );
    }

    /** Convert a standard file uri to a uri usable by this webview. */
    private toWebviewUri(pathList: string[]) {
        return this._panel.webview.asWebviewUri(
            vscode.Uri.joinPath(this._extensionUri, ...pathList)
        );
    }

    /** Send a message to the webview */
    public static sendMessage(
        command: string,
        data: { [index: string]: unknown } | unknown
    ) {
        WebVue.currentPanel._panel.webview.postMessage({ command, data });
    }

    public static sendNotification(message: Notification) {
        WebVue.sendMessage("notify", message);
    }

    /** Set the loading state of a store in the webview */
    public static setLoadingState(loading: boolean) {
        WebVue.sendMessage("addonStore", {
            property: "loading",
            value: loading,
        });
    }

    /** Reveal or create a new panel in VS Code */
    public static render(context: vscode.ExtensionContext) {
        const extensionUri = context.extensionUri;

        if (WebVue.currentPanel) {
            WebVue.currentPanel._panel.reveal(vscode.ViewColumn.One);
        } else {
            const panel = vscode.window.createWebviewPanel(
                "lua-addon_manager",
                "Lua Addon Manager",
                vscode.ViewColumn.Active,
                {
                    enableScripts: true,
                    enableForms: false,
                    localResourceRoots: [extensionUri],
                }
            );

            WebVue.currentPanel = new WebVue(context, panel);
        }

        const workspaceOpen =
            vscode.workspace.workspaceFolders !== undefined &&
            vscode.workspace.workspaceFolders.length > 0;
        const clientVersion = context.extension.packageJSON.version;

        WebVue.sendMessage("appStore", {
            property: "workspaceState",
            value: workspaceOpen,
        });
        WebVue.sendMessage("appStore", {
            property: "clientVersion",
            value: clientVersion,
        });
        localLogger.debug(`Workspace Open: ${workspaceOpen}`);
    }

    /** Dispose of panel to clean up resources when it is closed */
    public dispose() {
        WebVue.currentPanel = undefined;

        this._panel?.dispose();

        while (this._disposables.length) {
            const disposable = this._disposables.pop();
            if (disposable) {
                disposable.dispose();
            }
        }
    }

    /** Get the HTML content of the webview */
    private _getWebViewContent(
        webview: vscode.Webview,
        context: vscode.ExtensionContext
    ) {
        if (context.extensionMode !== vscode.ExtensionMode.Production) {
            return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <title>Lua Addon Manager</title>
                <style>
                    html,body {
                        height: 100%;
                        display: block;
                        margin: 0;
                        padding: 0;
                    }
                    iframe {
                        width: 100%;
                        height: 100%;
                        display: block;
                        border: none;
                        user-select: none;
                    }
                </style>
            </head>
            <body>
                <iframe src="${DEVELOPMENT_IFRAME_URL}"></iframe>
                <script>
                    const vscode = acquireVsCodeApi();

                    const devIframe = document.querySelector("iframe");
                    window.addEventListener("message", (message) => {
                        // If message is from VS Code


                        if (message.origin.startsWith("vscode-webview")) {
                            console.groupCollapsed("DEV: VS Code ➡️ WebVue");
                            console.log(message.data);
                            console.groupEnd();
                            devIframe.contentWindow.postMessage(message.data, devIframe.src)
                            return;
                        }

                        if (message.source === devIframe.contentWindow) {
                            console.groupCollapsed("DEV: WebVue ➡️ VS Code");
                            console.log(message.data);
                            console.groupEnd();
                            vscode.postMessage(message.data);
                            return;
                        }

                        console.error("Source unknown");
                        console.error(message);
                    })
                </script>
            </body>
            </html>
            `;
        } else {
            const stylesUri = this.toWebviewUri([
                "client",
                "webvue",
                "build",
                "assets",
                "index.css",
            ]);
            const scriptUri = this.toWebviewUri([
                "client",
                "webvue",
                "build",
                "assets",
                "index.js",
            ]);
            const codiconUri = this.toWebviewUri([
                "client",
                "webvue",
                "build",
                "assets",
                "codicon.ttf",
            ]);

            const inlineStyleNonce = this.getNonce();
            const scriptNonce = this.getNonce();

            return `
            <!DOCTYPE html>
            <html lang="en">
            <head>
                <meta charset="UTF-8">
                <meta name="viewport" content="width=device-width, initial-scale=1.0">
                <meta http-equiv="Content-Security-Policy" content="default-src 'none'; style-src ${webview.cspSource} 'nonce-${inlineStyleNonce}'; font-src ${webview.cspSource}; script-src 'nonce-${scriptNonce}';">
                <link rel="stylesheet" type="text/css" href="${stylesUri}">
                <title>Lua Addon Manager</title>
                <style nonce="${inlineStyleNonce}">
                    @font-face {
                        font-family: "codicon";
                        src: url(${codiconUri}) format("truetype");
                    }
                </style>
            </head>
            <body>
                <div id="app"></div>
                <script type="module" src="${scriptUri}" nonce="${scriptNonce}"></script>
            </body>
            </html>
            `;
        }
    }

    /** Get a `nonce` (number used once). Used for the content security policy.
     *
     * [MDN](https://developer.mozilla.org/en-US/docs/Web/HTML/Global_attributes/nonce)
     */
    private getNonce() {
        let text = "";
        const possible =
            "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        for (let i = 0; i < 32; i++) {
            text += possible.charAt(
                Math.floor(Math.random() * possible.length)
            );
        }
        return text;
    }

    /** Sets up event listener for messages sent from webview */
    private _setWebviewMessageListener(
        webview: vscode.Webview,
        context: vscode.ExtensionContext
    ) {
        return webview.onDidReceiveMessage((message: WebVueMessage) => {
            const command = message.command;
            commandLogger.verbose(
                `Executing "${command}" (${JSON.stringify(message)})`
            );

            try {
                commands[command](context, message);
            } catch (e) {
                commandLogger.error(e);
            }
        });
    }
}
