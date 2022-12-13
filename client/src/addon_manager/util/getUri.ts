import { Uri, Webview } from "vscode";

/** Convert Uris to Uris that are usable by a webview */
export function getUri(
    webview: Webview,
    extensionUri: Uri,
    pathList: string[]
) {
    return webview.asWebviewUri(Uri.joinPath(extensionUri, ...pathList));
}
