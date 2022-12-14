import axios, { AxiosError, AxiosPromise, AxiosResponse } from "axios";
import * as vscode from "vscode";
import { logger } from "../../logger";
import { REPOSITORY_OWNER, REPOSITORY_NAME, ADDONS_DIRECTORY } from "../config";

import type { TreeNode } from "../types/github";

type Message = {
    command: string;
    name: string;
    tree: TreeNode[];
};

export default async (context: vscode.ExtensionContext, data: Message) => {
    const endpoint = `https://raw.githubusercontent.com/${REPOSITORY_OWNER}/${REPOSITORY_NAME}/main/${ADDONS_DIRECTORY}`;
    const extensionStorageURI = context.globalStorageUri;
    const addonDirectoryURI = vscode.Uri.joinPath(
        extensionStorageURI,
        data.name
    );

    // NOTE: Creates directory. If it does not exist, does nothing
    await vscode.workspace.fs.createDirectory(addonDirectoryURI);

    const promises = [];
    for (const node of data.tree) {
        const uri = vscode.Uri.joinPath(addonDirectoryURI, node.path);

        switch (node.type) {
            case "tree":
                await vscode.workspace.fs.createDirectory(uri);
                break;
            case "blob":
                const rawURL = `${endpoint}/${data.name}/${node.path}`;

                logger.debug(`Attempting download of ${rawURL}...`);

                promises.push(
                    axios
                        .get<string>(rawURL, { responseType: "text" })
                        .then((response) => {
                            // Convert raw string to byte array
                            logger.http(response, `Downloaded ${node.path}!`);
                            const content = Uint8Array.from(
                                Array.from(response.data).map((letter) =>
                                    letter.charCodeAt(0)
                                )
                            );

                            // Write byte array to file
                            promises.push(
                                vscode.workspace.fs
                                    .writeFile(uri, content)
                                    .then(
                                        () => {
                                            logger.debug(
                                                `Wrote to ${uri.path}`
                                            );
                                        },
                                        (reason) => {
                                            logger.error(
                                                `Failed to write to ${uri.path} (${reason})`
                                            );
                                        }
                                    )
                            );
                        })
                        .catch((error: AxiosError) => {
                            let errorMessage = "Unknown Error Occurred";
                            const response = error.response;

                            if (response) {
                                errorMessage = `${response.status}: ${response.statusText}`;
                            } else {
                                errorMessage = `${error.name}: ${error.message}`;
                            }
                            logger.error(
                                `Failed to download ${rawURL} (${errorMessage})`
                            );
                        })
                );
                break;
            default:
                logger.warn(`Unsupported file type in tree: ${node.type}`);
                break;
        }
    }

    Promise.all(promises)
        .then(() => {
            logger.info(`Successfully downloaded "${data.name}" addon!`);
        })
        .catch(() => {
            logger.error(
                `There was an error while downloading ${data.name} addon!`
            );
        });
};
