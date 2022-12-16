import axios from "axios";
import * as vscode from "vscode";
import getInstalled from "./getInstalled";
import { REPOSITORY_OWNER, REPOSITORY_NAME, ADDONS_DIRECTORY } from "../config";
import { stringToByteArray } from "../../services/string.service";
import { createChildLogger } from "../../services/logging.service";
import uninstall from "./uninstall";

import type { TreeNode } from "../types/github";

const localLogger = createChildLogger("Download Addon");

type Message = {
    name: string;
    tree: TreeNode[];
    hash: string;
};

export default async (
    context: vscode.ExtensionContext,
    webview: vscode.Webview,
    data: Message
) => {
    const endpoint = `https://raw.githubusercontent.com/${REPOSITORY_OWNER}/${REPOSITORY_NAME}/main/${ADDONS_DIRECTORY}`;
    const extensionStorageURI = context.globalStorageUri;
    const addonDirectoryURI = vscode.Uri.joinPath(
        extensionStorageURI,
        ADDONS_DIRECTORY,
        data.name
    );

    const promises = [];

    // Save version info
    promises.push(saveHashToFile(addonDirectoryURI, data.hash));

    for (const node of data.tree) {
        const uri = vscode.Uri.joinPath(addonDirectoryURI, node.path);

        switch (node.type) {
            case "tree":
                await vscode.workspace.fs.createDirectory(uri);
                break;
            case "blob":
                const rawURL = `${endpoint}/${data.name}/${node.path}`;

                const promise = new Promise(async (resolve, reject) => {
                    const response = await axios.get(rawURL, {
                        responseType: "text",
                    });
                    const content = stringToByteArray(response.data);

                    try {
                        await vscode.workspace.fs.writeFile(uri, content);
                        localLogger.verbose(`Wrote to ${uri.path}!`);
                        resolve(true);
                    } catch (e) {
                        const message = `Failed to write to ${uri.path} (${e})`;
                        reject(e);
                    }
                });

                promises.push(promise);
                break;
            default:
                localLogger.warn(`Unsupported file type in tree: ${node.type}`);
                break;
        }
    }

    return Promise.all(promises)
        .then(() => {
            localLogger.info(`Successfully downloaded "${data.name}" addon!`);
            getInstalled(context, webview);
        })
        .catch((e) => {
            localLogger.error(
                `There was an error while downloading ${data.name} addon!`
            );
            localLogger.error(e);
            uninstall(context, webview, { name: data.name });
        });
};

const saveHashToFile = (path: vscode.Uri, hash: string) => {
    const uri = vscode.Uri.joinPath(path, ".version");

    return new Promise(async (resolve) => {
        await vscode.workspace.fs.writeFile(uri, stringToByteArray(hash));
        localLogger.info(`Saved version info`);
        resolve(true);
    });
};
