import * as vscode from "vscode";

import { logger } from "../../logger";
import { getUri } from "../util/getUri";
import { credentials } from "../authentication";
import path = require("path");

/** Name of the folder containing addons in the remote repo */
export const ADDON_FOLDER = "addons";

export class AddonManager {
    public static currentPanel: AddonManager | undefined;
    private readonly _panel: vscode.WebviewPanel;
    private readonly _extensionUri: vscode.Uri;
    private _disposables: vscode.Disposable[] = [];
    private addons = [];

    private constructor(panel: vscode.WebviewPanel, extensionUri: vscode.Uri) {
        this._panel = panel;
        this._extensionUri = extensionUri;
        this._panel.onDidDispose(this.dispose, null, this._disposables);
        this._setWebviewMessageListener(this._panel.webview);
        this._panel.iconPath = {
            dark: vscode.Uri.joinPath(extensionUri, "images", "logo.png"),
            light: vscode.Uri.joinPath(extensionUri, "images", "logo.png"),
        };
        this._panel.webview.html = this._getWebViewContent(
            this._panel.webview,
            extensionUri
        );
    }

    /** Reveal or create a new panel in VS Code */
    public static render(extensionUri: vscode.Uri) {
        if (AddonManager.currentPanel) {
            AddonManager.currentPanel._panel.reveal(vscode.ViewColumn.One);
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

            AddonManager.currentPanel = new AddonManager(panel, extensionUri);
        }

        // Ask user to login and send their access token to the webview
        credentials.login(true).then(() => {
            AddonManager.currentPanel._panel.webview.postMessage({
                command: "accessToken",
                data: credentials.access_token,
            });
        });
    }

    /** Dispose of panel to clean up resources when it is closed */
    public dispose() {
        AddonManager.currentPanel = undefined;

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
        extensionUri: vscode.Uri
    ) {
        const stylesUri = getUri(webview, extensionUri, [
            "client",
            "webvue",
            "build",
            "assets",
            "index.css",
        ]);
        const scriptUri = getUri(webview, extensionUri, [
            "client",
            "webvue",
            "build",
            "assets",
            "index.js",
        ]);
        const codiconUri = getUri(webview, extensionUri, [
            "client",
            "webvue",
            "build",
            "assets",
            "codicon.ttf",
        ]);

        // TODO: Lock down CSP https://code.visualstudio.com/api/extension-guides/webview#content-security-policy
        return `
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <link rel="stylesheet" type="text/css" href="${stylesUri}">
            <title>Hello World!</title>
            <style>
                @font-face {
                    font-family: "codicon";
                    src: url(${codiconUri}) format("truetype");
                }
            </style>
        </head>
        <body>
            <div id="app"></div>
            <script type="module" src="${scriptUri}"></script>
        </body>
        </html>
        `;
    }

    /** Sets up event listener for messages sent from webview */
    private _setWebviewMessageListener(webview: vscode.Webview) {
        webview.onDidReceiveMessage((message: any) => {
            const command = message.command;
            vscode.window.showInformationMessage(command);
        });
    }
}
