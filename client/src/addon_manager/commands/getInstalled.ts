import * as vscode from "vscode";
import { logger } from "../../logger";
import { ADDONS_DIRECTORY } from "../config";

const MAX_TRAVERSAL_DEPTH = 10;

async function traverse<T extends number>(
    path: vscode.Uri,
    depth: number
): Promise<number | false>;
async function traverse(path: vscode.Uri): Promise<number>;
async function traverse(path: vscode.Uri, depth = 0) {
    let size = 0;

    return new Promise<number | false>(async (resolve, reject) => {
        if (depth >= MAX_TRAVERSAL_DEPTH) {
            logger.warn(
                `Max traversal depth (${MAX_TRAVERSAL_DEPTH}) reached while reading addons directory. Stopped at ${path.path}`
            );
            resolve(false);
        }

        const files = await vscode.workspace.fs.readDirectory(path);

        for (const file of files) {
            const name = file[0];
            const type = file[1];
            const uri = vscode.Uri.joinPath(path, name);

            switch (type) {
                case vscode.FileType.File:
                    logger.debug(`Found file ${uri.path}`);
                    const stats = await vscode.workspace.fs.stat(uri);
                    size += stats.size;
                    break;
                case vscode.FileType.Directory:
                    logger.debug(`Found directory ${uri.path}`);
                    const sum = await traverse(uri, depth + 1);
                    if (!sum) {
                        break;
                    }
                    size += sum;
                    break;
                default:
                    logger.warn(`Found unsupported file type @ ${uri.path}`);
                    break;
            }
        }
        resolve(size);
    });
}

type Addon = {
    name: string;
    description: string;
    size: number;
    latestHash?: string;
};

export default async (
    context: vscode.ExtensionContext,
    webview: vscode.Webview
) => {
    const extensionStorageURI = context.globalStorageUri;
    const addonsDirectoryURI = vscode.Uri.joinPath(
        extensionStorageURI,
        ADDONS_DIRECTORY
    );

    const addons: Addon[] = [];
    let totalSize = 0;

    try {
        const entries = await vscode.workspace.fs.readDirectory(
            addonsDirectoryURI
        );

        for (const entry of entries) {
            const name = entry[0];
            const addonUri = vscode.Uri.joinPath(addonsDirectoryURI, name);
            const configFileURI = vscode.Uri.joinPath(addonUri, "config.json");

            const addon = { name, description: "", size: 0 };

            // Get config file
            // Gets description of addon
            try {
                const content = await vscode.workspace.fs.readFile(
                    configFileURI
                );
                const json = JSON.parse(content.toString());
                addon.description = json.description;
            } catch (e) {
                logger.error(
                    `Failed to get installed addon (${configFileURI.path}) description! (${e})`
                );
            }

            const size = await traverse(addonUri);
            addon.size = size;
            totalSize += size;
            addons.push(addon);
        }

        webview.postMessage({
            command: "localAddons",
            addons,
            totalSize,
        });
    } catch (e) {
        logger.error(`Failed to read addons install directory (${e})`);
    }
};
